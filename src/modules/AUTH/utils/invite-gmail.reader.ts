import { ImapFlow } from "imapflow";
import { extractInviteTokenFromContent } from "./invite-token.extract";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface GmailInviteCaptureOptions {
  /** Invitee address from POST /invite (delivered to GMAIL_IMAP_USER inbox). */
  recipientEmail: string;
  /** Only consider messages received after this time. */
  sentAfter: Date;
  invitationId?: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export interface GmailInviteCaptureResult {
  token: string;
  messageId: string;
  subject: string;
  receivedAt: Date;
  mailbox: string;
}

/** Cap raw message download size — invite emails are small HTML/text links. */
const MAX_MESSAGE_SOURCE_BYTES = 256 * 1024;

function resolveGmailCaptureTimeoutMs(): number {
  const raw = process.env.GMAIL_INVITE_CAPTURE_TIMEOUT_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 180_000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 180_000;
}

function resolveGmailCapturePollMs(): number {
  const raw = process.env.GMAIL_INVITE_CAPTURE_POLL_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 5_000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5_000;
}

function resolveImapHost(): string {
  return (
    process.env.GMAIL_IMAP_HOST?.trim() ||
    process.env.INVITE_IMAP_HOST?.trim() ||
    "imap.gmail.com"
  );
}

function isGoogleImapHost(host: string): boolean {
  return host.toLowerCase().includes("gmail.com");
}

function resolveGmailMailboxes(): string[] {
  const custom = process.env.GMAIL_INVITE_MAILBOXES?.trim();
  if (custom) {
    return custom.split(",").map((box) => box.trim()).filter(Boolean);
  }
  const host = resolveImapHost();
  if (isGoogleImapHost(host)) {
    return ["INBOX", "[Gmail]/Spam"];
  }
  return ["INBOX"];
}

function resolveGmailScanLimit(): number {
  const parsed = Number.parseInt(
    process.env.GMAIL_INVITE_SCAN_LIMIT?.trim() ?? "12",
    10,
  );
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 20) : 12;
}

function envelopeIncludesRecipient(
  addresses: Array<{ address?: string }> | undefined,
  recipientEmail: string,
): boolean {
  if (!addresses?.length) {
    return false;
  }
  const needle = normalizeEmail(recipientEmail);
  return addresses.some(
    (entry) => entry.address && normalizeEmail(entry.address) === needle,
  );
}

function messageMatchesEnvelope(
  envelope: import("imapflow").MessageEnvelopeObject,
  recipientEmail: string,
  sentAfter: Date,
  subjectNeedle?: string,
): boolean {
  const receivedAt = envelope.date ?? new Date();
  const skewMs = 120_000;
  if (receivedAt.getTime() < sentAfter.getTime() - skewMs) {
    return false;
  }

  if (
    !envelopeIncludesRecipient(envelope.to, recipientEmail) &&
    !envelopeIncludesRecipient(envelope.cc, recipientEmail)
  ) {
    return false;
  }

  const subject = envelope.subject ?? "";
  if (subjectNeedle && !subject.toLowerCase().includes(subjectNeedle)) {
    return false;
  }

  return true;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function scanMailboxForInvite(
  client: ImapFlow,
  mailbox: string,
  options: {
    recipientEmail: string;
    sentAfter: Date;
    subjectNeedle?: string;
    seenMessageIds: Set<string>;
    scanLimit: number;
  },
): Promise<GmailInviteCaptureResult | null> {
  const lock = await client.getMailboxLock(mailbox);
  try {
    const mailboxRef = client.mailbox;
    if (!mailboxRef) {
      return null;
    }
    const exists = mailboxRef.exists ?? 0;
    if (exists === 0) {
      return null;
    }

    const startSeq = Math.max(1, exists - options.scanLimit + 1);

    const candidates: Array<{
      uid: number;
      envelope: import("imapflow").MessageEnvelopeObject;
    }> = [];

    const headersOnly = client.fetch(`${startSeq}:*`, {
      envelope: true,
      uid: true,
    });

    for await (const message of headersOnly) {
      if (!message.envelope) {
        continue;
      }
      if (
        !messageMatchesEnvelope(
          message.envelope,
          options.recipientEmail,
          options.sentAfter,
          options.subjectNeedle,
        )
      ) {
        continue;
      }
      candidates.push({ uid: message.uid, envelope: message.envelope });
    }

    for (const candidate of candidates.reverse()) {
      const envelope = candidate.envelope;
      const messageId = envelope.messageId ?? `uid:${candidate.uid}`;
      if (options.seenMessageIds.has(messageId)) {
        continue;
      }
      options.seenMessageIds.add(messageId);

      let raw = "";
      const bodyFetch = client.fetch(
        { uid: candidate.uid },
        {
          source: { maxLength: MAX_MESSAGE_SOURCE_BYTES },
          uid: true,
        },
      );

      for await (const part of bodyFetch) {
        if (part.source) {
          raw = part.source.toString("utf8");
          break;
        }
      }

      if (!raw.toLowerCase().includes(normalizeEmail(options.recipientEmail))) {
        continue;
      }

      const token = extractInviteTokenFromContent(raw);
      if (!token) {
        continue;
      }

      return {
        token,
        messageId,
        subject: envelope.subject ?? "",
        receivedAt: envelope.date ?? new Date(),
        mailbox,
      };
    }

    return null;
  } finally {
    lock.release();
  }
}

/**
 * Poll Gmail inbox (IMAP + app password) for the invitation email and parse `token` from the link.
 */
export async function captureInviteTokenFromGmail(
  options: GmailInviteCaptureOptions,
): Promise<GmailInviteCaptureResult> {
  const user = process.env.GMAIL_IMAP_USER?.trim();
  const pass = process.env.GMAIL_IMAP_APP_PASSWORD?.trim().replace(/\s+/g, "");

  if (!user || !pass) {
    throw new Error(
      "Gmail capture requires GMAIL_IMAP_USER and GMAIL_IMAP_APP_PASSWORD in .env",
    );
  }

  const timeoutMs = options.timeoutMs ?? resolveGmailCaptureTimeoutMs();
  const pollIntervalMs = options.pollIntervalMs ?? resolveGmailCapturePollMs();
  const recipientEmail = normalizeEmail(options.recipientEmail);
  const deadline = Date.now() + timeoutMs;
  const subjectNeedle = process.env.GMAIL_INVITE_SUBJECT_CONTAINS?.trim().toLowerCase();
  const mailboxes = resolveGmailMailboxes();
  const scanLimit = resolveGmailScanLimit();

  const imapHost = resolveImapHost();
  if (isGoogleImapHost(imapHost) && pass.length < 16) {
    throw new Error(
      "GMAIL_IMAP_APP_PASSWORD must be a Google App Password (16 characters), not your Gmail login password.",
    );
  }

  const client = new ImapFlow({
    host: imapHost,
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const seenMessageIds = new Set<string>();

  try {
    try {
      await client.connect();
    } catch (connectError) {
      const detail =
        connectError instanceof Error ? connectError.message : String(connectError);
      throw new Error(
        `IMAP login failed for ${user} on ${imapHost}. ${detail}. ` +
          (isGoogleImapHost(imapHost)
            ? "Use a 16-character Google App Password and enable IMAP in Gmail settings."
            : "Check IMAP is enabled, GMAIL_IMAP_HOST / INVITE_IMAP_HOST, and your mailbox password."),
      );
    }

    while (Date.now() < deadline) {
      for (const mailbox of mailboxes) {
        try {
          const found = await scanMailboxForInvite(client, mailbox, {
            recipientEmail,
            sentAfter: options.sentAfter,
            subjectNeedle,
            seenMessageIds,
            scanLimit,
          });
          if (found) {
            return found;
          }
        } catch {
          // Mailbox may not exist on all accounts — continue
        }
      }

      await sleep(pollIntervalMs);
    }

    throw new Error(
      `Gmail invite capture timed out after ${timeoutMs}ms for ${recipientEmail}. ` +
        `Checked: ${mailboxes.join(", ")}.`,
    );
  } finally {
    try {
      await client.logout();
    } catch {
      // Best-effort close
    }
  }
}
