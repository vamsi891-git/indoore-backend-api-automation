import { test, expect } from "@playwright/test";
import { AuthApi } from "../utils/auth.util";
import { TokenManager } from "../utils/token-manager";

test.describe("TokenManager concurrent refresh", () => {
  test.afterEach(() => {
    TokenManager.reset();
  });

  test("in-process parallel getToken refreshes once (refreshPromise)", async () => {
    let refreshCalls = 0;
    const originalRefresh = AuthApi.refresh.bind(AuthApi);

    AuthApi.refresh = async () => {
      refreshCalls += 1;
      await new Promise((r) => setTimeout(r, 80));
      return {
        accessToken: `concurrent-token-${refreshCalls}`,
        expiresIn: 900,
        csrfToken: "csrf-concurrent",
      };
    };

    try {
      TokenManager.reset();
      TokenManager.discardStoredSession();
      // expiresInSeconds=1 → refreshAt is already in the past (180s buffer).
      TokenManager.seed("stale-token", 1, "csrf-stale");

      const tokens = await Promise.all([
        TokenManager.getToken(),
        TokenManager.getToken(),
        TokenManager.getToken(),
        TokenManager.getToken(),
      ]);

      expect(refreshCalls).toBe(1);
      expect(new Set(tokens).size).toBe(1);
      expect(tokens[0]).toBe("concurrent-token-1");
    } finally {
      AuthApi.refresh = originalRefresh;
      TokenManager.discardStoredSession();
      TokenManager.reset();
    }
  });

  test("file lock wx prevents overlapping lock holders", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const authDir = path.join(process.cwd(), "playwright", ".auth");
    const lockPath = path.join(authDir, "refresh.lock");
    fs.mkdirSync(authDir, { recursive: true });
    TokenManager.clearStaleLock();

    fs.writeFileSync(lockPath, `${process.pid}:${Date.now()}`, { flag: "wx" });
    let secondGotLock = true;
    try {
      fs.writeFileSync(lockPath, `${process.pid}:overlap`, { flag: "wx" });
    } catch {
      secondGotLock = false;
    } finally {
      try {
        fs.unlinkSync(lockPath);
      } catch {
        // ignore
      }
    }
    expect(secondGotLock).toBe(false);
  });
});
