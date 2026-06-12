export interface InviteE2eSummary {
  inviteEmail: string;
  invitationId: string;
  role: string;
  pendingVerified: boolean;
  previewVerified: boolean;
  acceptVerified: boolean;
  acceptedInListVerified: boolean;
  userId?: string;
}

export type InviteE2eStep = "sent" | "preview" | "accept";

export interface InviteE2eStepBanner {
  step: InviteE2eStep;
  email: string;
  invitationId: string;
  role: string;
  userId?: string;
  /** Shown when accept was validated earlier in the suite (90-invite-accept-validate). */
  acceptReusedFromSuite?: boolean;
}

const STEP_LABELS: Record<InviteE2eStep, string> = {
  sent: "INVITE EMAIL SENT",
  preview: "INVITE PREVIEWED",
  accept: "INVITE ACCEPTED — USER CREATED",
};

/** Prints a single-line step confirmation as each E2E stage completes. */
export function printInviteE2eStepBanner(banner: InviteE2eStepBanner): void {
  const divider = "=".repeat(50);

  console.log(`\n${divider}`);
  console.log(`E2E STEP — ${STEP_LABELS[banner.step]}`);
  console.log(divider);
  console.log("STATUS                    : SUCCESS");
  console.log(`EMAIL                     : ${banner.email}`);
  console.log(`INVITATION ID             : ${banner.invitationId}`);
  console.log(`ROLE                      : ${banner.role}`);
  if (banner.userId) {
    console.log(`NEW USER ID               : ${banner.userId}`);
  }
  if (banner.acceptReusedFromSuite) {
    console.log(
      "NOTE                      : Accept validated in 90-invite-accept-validate (suite reuse)",
    );
  }
  console.log(`${divider}\n`);
}

export function printInviteE2eSummary(summary: InviteE2eSummary): void {
  const divider = "=".repeat(50);
  const allWorking =
    summary.pendingVerified &&
    summary.previewVerified &&
    summary.acceptVerified &&
    summary.acceptedInListVerified;

  console.log(`\n${divider}`);
  console.log("INVITE E2E FLOW SUMMARY");
  console.log(divider);
  console.log(
    `E2E FLOW STATUS            : ${allWorking ? "ALL STEPS WORKING" : "INCOMPLETE"}`,
  );
  console.log(
    `ADMIN INVITE SENT          : ${summary.invitationId ? "SUCCESS" : "FAILED"}`,
  );
  console.log(
    `PENDING IN MINE (BY ID)    : ${summary.pendingVerified ? "SUCCESS" : "FAILED"}`,
  );
  console.log(
    `PREVIEW VERIFIED           : ${summary.previewVerified ? "SUCCESS" : "SKIPPED"}`,
  );
  console.log(
    `ACCEPT COMPLETED           : ${summary.acceptVerified ? "SUCCESS" : "SKIPPED"}`,
  );
  console.log(
    `ACCEPTED IN MINE (BY ID)   : ${summary.acceptedInListVerified ? "SUCCESS" : "SKIPPED"}`,
  );
  console.log(`EMAIL                     : ${summary.inviteEmail}`);
  console.log(`INVITATION ID             : ${summary.invitationId}`);
  console.log(`ROLE                      : ${summary.role}`);
  if (summary.userId) {
    console.log(`NEW USER ID               : ${summary.userId}`);
  }
  if (!summary.previewVerified) {
    const disposable = summary.inviteEmail.toLowerCase().endsWith("@example.com");
    if (disposable) {
      console.log(
        "NOTE                      : Invite went to @example.com (no inbox). Add GMAIL_IMAP_* to .env",
      );
    } else {
      console.log(
        "NOTE                      : Copy token from email → INVITE_ACCEPT_TOKEN, then re-run with INVITE_E2E_REUSE_CONTEXT=true",
      );
    }
  } else if (summary.acceptVerified) {
    console.log(
      "NOTE                      : Re-run full e2e anytime — each run sends a new invite + new token",
    );
  }
  console.log(`${divider}\n`);
}
