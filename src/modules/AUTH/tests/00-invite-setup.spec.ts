import { test } from "../../../fixtures/api.fixture";
import {
  ensureSharedInviteTokenForAuthSuite,
  INVITE_PROVISION_TEST_TIMEOUT_MS,
} from "../utils/invite-provision.helper";
import { isGmailInviteCaptureConfigured } from "../Data/invite.data";
import { clearSuiteAcceptSnapshot } from "../utils/invite-token.store";

/**
 * Runs first (00- prefix) — provisions one shared pending invite for preview/validate.
 * Accept/e2e specs use their own dedicated invites via provisionFreshPendingInvite.
 */
test.describe("Auth Invite Suite Setup", () => {
  test.describe.configure({ mode: "serial", timeout: INVITE_PROVISION_TEST_TIMEOUT_MS });

  test.beforeAll(() => {
    clearSuiteAcceptSnapshot();
  });

  test(
    "Provision shared invite token for read-only specs",
    { tag: ["@auth", "@invite", "@e2e"] },
    async ({ authenticatedApi }) => {
      if (!isGmailInviteCaptureConfigured()) {
        test.skip(
          true,
          "Gmail IMAP not configured — set GMAIL_IMAP_USER and GMAIL_IMAP_APP_PASSWORD",
        );
        return;
      }

      await ensureSharedInviteTokenForAuthSuite(authenticatedApi);
    },
  );
});
