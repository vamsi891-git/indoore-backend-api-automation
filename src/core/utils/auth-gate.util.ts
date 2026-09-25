/**
 * Shared gate so captcha login storms stop once the auth API returns 429.
 * Used by AuthApi (login) and TokenManager (401 recovery).
 */
export class AuthGate {
  private static rateLimitedUntilMs = 0;

  static markRateLimited(retryAfterSec: number): void {
    const sec = Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec : 600;
    const until = Date.now() + Math.round(sec * 1000);
    if (until > this.rateLimitedUntilMs) {
      this.rateLimitedUntilMs = until;
    }
  }

  static isRateLimited(): boolean {
    return Date.now() < this.rateLimitedUntilMs;
  }

  static remainingSec(): number {
    return Math.max(0, Math.ceil((this.rateLimitedUntilMs - Date.now()) / 1000));
  }

  static assertNotRateLimited(action: string): void {
    if (!this.isRateLimited()) {
      return;
    }
    const waitSec = this.remainingSec();
    const until = new Date(Date.now() + waitSec * 1000).toLocaleTimeString();
    throw new Error(
      `Auth API rate-limited (429). Skip ${action}; wait ~${Math.ceil(waitSec / 60)} minute(s) until about ${until}. ` +
        `Do not re-run immediately — each captcha/login attempt extends the lock. (retry-after=${waitSec}s)`,
    );
  }
}
