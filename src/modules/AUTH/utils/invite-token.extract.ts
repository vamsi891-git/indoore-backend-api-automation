/** Extract invite token from email HTML/text or raw MIME source. */
export function extractInviteTokenFromContent(content: string): string | null {
  const decoded = content
    .replace(/=\r?\n/g, "")
    .replace(/=3D/gi, "=")
    .replace(/&amp;/g, "&");

  const patterns = [
    /[?&](?:token|inviteToken)=([A-Za-z0-9_-]{20,512})/i,
    /\/invite\/(?:preview|accept)[^"'>\s]*[?&](?:token|inviteToken)=([A-Za-z0-9_-]{20,512})/i,
    /token%3D([A-Za-z0-9_-]{20,512})/i,
    /inviteToken%3D([A-Za-z0-9_-]{20,512})/i,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}
