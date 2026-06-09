export const BackendResponse = {
  isServerError(status: number): boolean {
    return status >= 500;
  },

  isGatewayTimeout(status: number): boolean {
    return status === 504;
  },

  isRequestTimeoutError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes("Timeout") ||
      message.includes("timeout") ||
      message.includes("Request context disposed") ||
      message.includes("ECONNABORTED")
    );
  },

  logFinding(label: string, detail: string | number, body?: unknown): void {
    const suffix = body !== undefined ? ` ${JSON.stringify(body)}` : "";
    console.log(`BACKEND FINDING: ${label} — ${detail}${suffix}`);
  },

  shouldSkipServerFailure(
    status: number,
    label: string,
    body?: unknown
  ): boolean {
    if (!this.isServerError(status)) {
      return false;
    }
    this.logFinding(label, status, body);
    return true;
  }
};
