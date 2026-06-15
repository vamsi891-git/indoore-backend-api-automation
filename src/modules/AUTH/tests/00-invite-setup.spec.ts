import { test } from "../../../fixtures/api.fixture";
import {
  ensureSharedInviteTokenForAuthSuite,
  hydrateProcessFromSharedInviteStore,
  INVITE_PROVISION_TEST_TIMEOUT_MS,
  isInviteTransientErrorMessage,
} from "../utils/invite-provision.helper";
import {
  describeMissingInviteTokenSetup,
  hasGitignoredInviteTokenContext,
  isGmailInviteCaptureConfigured,
} from "../Data/invite.data";
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
        if (hydrateProcessFromSharedInviteStore()) {
          return;
        }
        if (hasGitignoredInviteTokenContext()) {
          return;
        }
        test.skip(true, describeMissingInviteTokenSetup());
        return;
      }

      try {
        await ensureSharedInviteTokenForAuthSuite(authenticatedApi);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (isInviteTransientErrorMessage(message)) {
          test.skip(
            true,
            `${message} — wait 30–60 minutes or fix backend SMTP, then re-run`,
          );
          return;
        }
        throw error;
      }
    },
  );
});
