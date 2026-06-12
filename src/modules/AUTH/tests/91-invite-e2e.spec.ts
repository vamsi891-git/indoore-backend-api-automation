import { expect, request } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { InviteApi, InvitePublicApi } from "../Api/invite.api";
import {
  beginFreshInviteE2eRun,
  buildUniqueInviteEmail,
  captureAndPublishInviteTokenFromGmail,
  describeMissingInviteTokenSetup,
  hasInviteAcceptToken,
  hydrateInviteE2eStateFromEnv,
  inviteEmailTokenEnvHint,
  InviteTestData,
  isDisposableInviteEmail,
  isGmailInviteCaptureConfigured,
  isAcceptSuccessStatus,
  resolveInviteAcceptPayload,
  resolveInviteAcceptToken,
  shouldReuseManualInviteContext,
} from "../Data/invite.data";
import { acceptInvitationWithRetry } from "../utils/invite-provision.helper";
import {
  loadSuiteAcceptSnapshot,
  markInviteAcceptTokenConsumed,
} from "../utils/invite-token.store";
import { InviteMapper } from "../Mapper/invite.mapper";
import { InviteValidator } from "../Validator/invite.validator";
import {
  InviteAcceptResponseSchema,
  InvitePreviewResponseSchema,
  InviteUserResponseSchema,
  SentInvitationsListResponseSchema,
} from "../schemas/auth.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { AuthValidator } from "../Validator/auth.validator";
import {
  printInviteE2eStepBanner,
  printInviteE2eSummary,
} from "../utils/invite-e2e.reporter";
import {
  adoptInviteForE2eWhenRateLimited,
  INVITE_PROVISION_TEST_TIMEOUT_MS,
  inviteUserWithRetry,
} from "../utils/invite-provision.helper";

interface InviteE2eState {
  inviteEmail: string;
  invitationId: string;
  role: string;
  userId?: string;
}

const e2eState: InviteE2eState = {
  inviteEmail: "",
  invitationId: "",
  role: InviteTestData.fallbackRole,
};

async function createPublicApiContext() {
  if (!process.env.BASE_URL) {
    throw new Error("BASE_URL missing in environment");
  }
  return request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: { Accept: "application/json" },
  });
}

function ensureInviteE2eState(): boolean {
  if (e2eState.invitationId) {
    return true;
  }
  return hydrateInviteE2eStateFromEnv(e2eState);
}

test.describe("Auth Invite E2E Flow", () => {
  test.describe.configure({
    mode: "serial",
    timeout: INVITE_PROVISION_TEST_TIMEOUT_MS,
  });

  test.beforeAll(() => {
    if (shouldReuseManualInviteContext()) {
      return;
    }
    beginFreshInviteE2eRun();
    e2eState.inviteEmail = "";
    e2eState.invitationId = "";
    e2eState.role = InviteTestData.fallbackRole;
    delete e2eState.userId;
  });

  test(
    "Step 1 — Admin sends invitation email",
    { tag: ["@auth", "@invite", "@e2e"] },
    async ({ authenticatedApi }) => {
      if (shouldReuseManualInviteContext()) {
        hydrateInviteE2eStateFromEnv(e2eState);
        test.info().annotations.push({
          type: "invite-flow",
          description:
            "reuse-context — INVITE_E2E_REUSE_CONTEXT=true (Steps 3–5 only)",
        });
        return;
      }

      const api = new InviteApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      const rolesResponse = await api.getRoles();
      const role = InviteMapper.resolveInvitableRole(
        rolesResponse.responseBody,
        InviteTestData.preferredRoles,
        InviteTestData.fallbackRole,
      );
      const inviteEmail = buildUniqueInviteEmail("e2e-invite");
      const invitePayload = { email: inviteEmail, role };
      const inviteSentAfter = new Date();

      let responseTime = 0;

      try {
        const inviteResponse = await inviteUserWithRetry(api, invitePayload);
        responseTime = inviteResponse.responseTime;
        const inviteStatus = inviteResponse.rawResponse.status();

        await PerformanceTracker.track(
          inviteResponse.rawResponse,
          "Auth Invite E2E — Admin Send",
          `${process.env.BASE_URL}/indore/auth/invite`,
          inviteResponse.responseTime,
        );

        if (inviteStatus !== 201) {
          const adopted = await adoptInviteForE2eWhenRateLimited(api);
          if (adopted) {
            e2eState.inviteEmail = adopted.email;
            e2eState.invitationId = adopted.invitationId;
            e2eState.role = adopted.role;

            validation.execute("Adopted Pending Invite", () => {
              expect(adopted.token.length).toBeGreaterThanOrEqual(20);
              expect(hasInviteAcceptToken()).toBe(true);
            });
            test.info().annotations.push({
              type: "invite-flow",
              description: `adopted-pending — skipped POST (${inviteStatus}); reused pending invite`,
            });
            printInviteE2eStepBanner({
              step: "sent",
              email: e2eState.inviteEmail,
              invitationId: e2eState.invitationId,
              role: e2eState.role,
            });
            return;
          }

          validation.execute("Admin Invite Status", () => {
            if (inviteStatus === 429) {
              throw new Error(
                "POST /indore/auth/invite rate limited (429) and no adoptable pending invite was found. " +
                  "Wait 30–60 minutes, run 00-invite-setup first, or set INVITE_E2E_REUSE_CONTEXT=true with token in .env",
              );
            }
            assert.validateStatusCode(
              inviteResponse.rawResponse,
              201,
              inviteResponse.responseBody,
            );
          });
        } else {
          validation.execute("Admin Invite Status", () =>
            assert.validateStatusCode(
              inviteResponse.rawResponse,
              201,
              inviteResponse.responseBody,
            ),
          );
          validation.execute("Admin Invite Zod", () => {
            const result = InviteUserResponseSchema.safeParse(
              inviteResponse.responseBody,
            );
            expect(result.success).toBe(true);
          });

          const parsed = InviteUserResponseSchema.parse(inviteResponse.responseBody);
          const inviteModel = InviteMapper.mapInviteUser(parsed);

          e2eState.inviteEmail = inviteEmail;
          e2eState.invitationId = inviteModel.invitationId;
          e2eState.role = role;

          validation.execute("Admin Invite Business Rules", () =>
            validator.validateInviteUserResponse(
              inviteModel,
              inviteEmail,
              new Date(),
              InviteTestData.inviteExpiryToleranceMs,
            ),
          );
          validation.execute("Admin Invite Email Sent Flag", () =>
            expect(inviteModel.emailSent).toBe(true),
          );

          if (isGmailInviteCaptureConfigured()) {
            let capturedToken: string | null = null;
            try {
              capturedToken = await captureAndPublishInviteTokenFromGmail({
                recipientEmail: inviteEmail,
                invitationId: inviteModel.invitationId,
                role,
                sentAfter: inviteSentAfter,
              });
            } catch (error) {
              const message =
                error instanceof Error ? error.message : String(error);
              validation.execute("Gmail Invite Token Capture", () => {
                throw new Error(message);
              });
            }
            if (capturedToken) {
              validation.execute("Gmail Invite Token Capture", () => {
                expect(capturedToken!.length).toBeGreaterThanOrEqual(20);
                expect(hasInviteAcceptToken()).toBe(true);
              });
              test.info().annotations.push({
                type: "invite-flow",
                description: "gmail-auto-capture — token from invite email",
              });
            }
          } else if (!hasInviteAcceptToken()) {
            const hint = describeMissingInviteTokenSetup();
            console.warn(
              `\n[invite-e2e] Steps 3–5 will be SKIPPED — no invite token.\n  ${hint}\n  Invitee used: ${inviteEmail}\n`,
            );
            test.info().annotations.push({
              type: "invite-flow",
              description: `no-token — ${hint}`,
            });
          }

          printInviteE2eStepBanner({
            step: "sent",
            email: e2eState.inviteEmail,
            invitationId: e2eState.invitationId,
            role: e2eState.role,
          });
        }
      } finally {
        validation.finalize("Auth Invite E2E — Admin Send", responseTime);
      }
    },
  );

  test(
    "Step 2 — Verify pending invitation in mine list by ID",
    { tag: ["@auth", "@invite", "@e2e"] },
    async ({ authenticatedApi }) => {
      const api = new InviteApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      test.skip(!ensureInviteE2eState(), inviteEmailTokenEnvHint);

      const listResponse = await api.listMyInvitations({
        page: 1,
        limit: InviteTestData.e2eListScanLimit,
        status: "pending",
      });

      try {
        validation.execute("Mine Pending Status", () =>
          assert.validateStatusCode(listResponse.rawResponse, 200),
        );
        validation.execute("Mine Pending Zod", () => {
          const result = SentInvitationsListResponseSchema.safeParse(
            listResponse.responseBody,
          );
          expect(result.success).toBe(true);
        });

        const list = InviteMapper.mapSentInvitationsList(
          SentInvitationsListResponseSchema.parse(listResponse.responseBody),
        );

        validation.execute("Invitation By ID In Mine List", () =>
          validator.validateInvitationByIdInList(
            list,
            e2eState.invitationId,
            e2eState.inviteEmail,
            e2eState.role,
            "pending",
          ),
        );

        const byIdLookup = await api.findInvitationInMyList(
          e2eState.invitationId,
          InviteTestData.e2eListScanLimit,
        );

        validation.execute("Invitation By ID Lookup", () => {
          expect(byIdLookup.rawResponse.status()).toBe(200);
          expect(byIdLookup.item).toBeDefined();
          expect(byIdLookup.item?.id).toBe(e2eState.invitationId);
        });
      } finally {
        validation.finalize(
          "Auth Invite E2E — Mine Pending By ID",
          listResponse.responseTime,
        );
      }
    },
  );

  test(
    "Step 3 — Preview invitation (public)",
    { tag: ["@auth", "@invite", "@e2e"] },
    async () => {
      test.skip(!hasInviteAcceptToken(), inviteEmailTokenEnvHint);
      test.skip(!ensureInviteE2eState(), inviteEmailTokenEnvHint);

      const publicCtx = await createPublicApiContext();
      const publicApi = new InvitePublicApi(publicCtx);
      const validation = new ValidationEngine();
      const validator = new InviteValidator();
      const acceptToken = resolveInviteAcceptToken()!;

      try {
        const preview = await publicApi.previewInvitation(acceptToken);

        await PerformanceTracker.track(
          preview.rawResponse,
          "Auth Invite E2E — Preview",
          `${process.env.BASE_URL}/indore/auth/invite/preview`,
          preview.responseTime,
        );

        validation.execute("Preview Status", () =>
          expect(preview.rawResponse.status()).toBe(200),
        );
        validation.execute("Preview Zod", () => {
          const result = InvitePreviewResponseSchema.safeParse(preview.responseBody);
          expect(result.success).toBe(true);
        });

        if (preview.rawResponse.status() === 200) {
          const parsed = InvitePreviewResponseSchema.parse(preview.responseBody);
          validation.execute("Preview Email And Role", () =>
            validator.validatePreviewSuccess(
              parsed,
              e2eState.inviteEmail,
              e2eState.role,
            ),
          );

          printInviteE2eStepBanner({
            step: "preview",
            email: e2eState.inviteEmail,
            invitationId: e2eState.invitationId,
            role: e2eState.role,
          });
        }

        validation.finalize("Auth Invite E2E — Preview", preview.responseTime);
      } finally {
        await publicCtx.dispose();
      }
    },
  );

  test(
    "Step 4 — Accept invitation and create user",
    { tag: ["@auth", "@invite", "@e2e"] },
    async () => {
      test.skip(!hasInviteAcceptToken(), inviteEmailTokenEnvHint);
      test.skip(!ensureInviteE2eState(), inviteEmailTokenEnvHint);

      const suiteAccept = loadSuiteAcceptSnapshot();
      const validation = new ValidationEngine();
      const validator = new InviteValidator();
      const authValidator = new AuthValidator();

      if (suiteAccept) {
        test.info().annotations.push({
          type: "invite-flow",
          description:
            "reuse-suite-accept — POST /invite/accept validated in 90-invite-accept-validate",
        });

        try {
          validation.execute("Accept Status", () =>
            validator.validateAcceptSuccessStatus(suiteAccept.status),
          );
          validation.execute("Accept Security", () =>
            authValidator.validateAuthResponseSecurity(suiteAccept.responseBody),
          );
          validation.execute("Accept Zod", () => {
            const result = InviteAcceptResponseSchema.safeParse(
              suiteAccept.responseBody,
            );
            expect(result.success).toBe(true);
          });

          const parsed = InviteAcceptResponseSchema.parse(suiteAccept.responseBody);
          e2eState.userId = suiteAccept.userId;

          validation.execute("Accept Full Response", () =>
            validator.validateAcceptResponse(
              parsed,
              suiteAccept.email,
              suiteAccept.role,
              InviteTestData.acceptPayload,
            ),
          );

          printInviteE2eStepBanner({
            step: "accept",
            email: suiteAccept.email,
            invitationId: suiteAccept.invitationId,
            role: suiteAccept.role,
            userId: suiteAccept.userId,
            acceptReusedFromSuite: true,
          });

          validation.finalize("Auth Invite E2E — Accept", suiteAccept.responseTime);
        } catch (error) {
          validation.finalize("Auth Invite E2E — Accept", suiteAccept.responseTime);
          throw error;
        }
        return;
      }

      const publicCtx = await createPublicApiContext();
      const acceptToken = resolveInviteAcceptToken()!;

      try {
        const acceptPayload = resolveInviteAcceptPayload() ?? {
          token: acceptToken,
          ...InviteTestData.acceptPayload,
        };

        const accept = await acceptInvitationWithRetry(publicCtx, acceptPayload);

        await PerformanceTracker.track(
          accept.rawResponse,
          "Auth Invite E2E — Accept",
          `${process.env.BASE_URL}/indore/auth/invite/accept`,
          accept.responseTime,
        );

        validation.execute("Accept Status", () =>
          validator.validateAcceptSuccessStatus(accept.rawResponse.status()),
        );
        validation.execute("Accept Security", () =>
          authValidator.validateAuthResponseSecurity(accept.responseBody),
        );
        validation.execute("Accept Zod", () => {
          const result = InviteAcceptResponseSchema.safeParse(accept.responseBody);
          expect(result.success).toBe(true);
        });

        if (isAcceptSuccessStatus(accept.rawResponse.status())) {
          const parsed = InviteAcceptResponseSchema.parse(accept.responseBody);
          e2eState.userId = parsed.data.user.id;

          validation.execute("Accept Full Response", () =>
            validator.validateAcceptResponse(
              parsed,
              e2eState.inviteEmail,
              e2eState.role,
              acceptPayload,
            ),
          );

          printInviteE2eStepBanner({
            step: "accept",
            email: e2eState.inviteEmail,
            invitationId: e2eState.invitationId,
            role: e2eState.role,
            userId: parsed.data.user.id,
          });

          markInviteAcceptTokenConsumed();
        }

        validation.finalize("Auth Invite E2E — Accept", accept.responseTime);
      } finally {
        await publicCtx.dispose();
      }
    },
  );

  test(
    "Step 5 — Verify accepted invitation in mine list by ID",
    { tag: ["@auth", "@invite", "@e2e"] },
    async ({ authenticatedApi }) => {
      test.skip(!ensureInviteE2eState(), inviteEmailTokenEnvHint);

      const suiteAccept = loadSuiteAcceptSnapshot();
      if (!e2eState.userId && suiteAccept) {
        e2eState.userId = suiteAccept.userId;
      }
      if (!e2eState.userId) {
        throw new Error(
          "Step 4 did not set userId — accept must succeed before mine-list verification",
        );
      }

      const acceptedInvitationId =
        suiteAccept?.invitationId ?? e2eState.invitationId;
      const acceptedEmail = suiteAccept?.email ?? e2eState.inviteEmail;
      const acceptedRole = suiteAccept?.role ?? e2eState.role;

      const api = new InviteApi(authenticatedApi);
      const assert = new AssertionEngine();
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      const listResponse = await api.listMyInvitations({
        page: 1,
        limit: InviteTestData.e2eListScanLimit,
        status: "accepted",
      });

      try {
        validation.execute("Mine Accepted Status", () =>
          assert.validateStatusCode(listResponse.rawResponse, 200),
        );

        const list = InviteMapper.mapSentInvitationsList(
          SentInvitationsListResponseSchema.parse(listResponse.responseBody),
        );

        validation.execute("Accepted Invitation By ID", () =>
          validator.validateInvitationByIdInList(
            list,
            acceptedInvitationId,
            acceptedEmail,
            acceptedRole,
            "accepted",
          ),
        );

        const item = InviteMapper.findInvitationById(
          list,
          acceptedInvitationId,
        );
        validation.execute("Accepted At Timestamp", () => {
          expect(item?.acceptedAt).toBeTruthy();
        });

        printInviteE2eSummary({
          inviteEmail: acceptedEmail,
          invitationId: acceptedInvitationId,
          role: acceptedRole,
          pendingVerified: true,
          previewVerified: true,
          acceptVerified: true,
          acceptedInListVerified: true,
          userId: e2eState.userId,
        });

        validation.finalize(
          "Auth Invite E2E — Mine Accepted By ID",
          listResponse.responseTime,
        );
      } catch (error) {
        validation.finalize(
          "Auth Invite E2E — Mine Accepted By ID",
          listResponse.responseTime,
        );
        throw error;
      }
    },
  );

  test(
    "Step 6 — Cleanup pending invitation when accept was skipped",
    { tag: ["@auth", "@invite", "@e2e"] },
    async ({ authenticatedApi }) => {
      if (!ensureInviteE2eState()) {
        throw new Error(inviteEmailTokenEnvHint);
      }

      const acceptCompleted = Boolean(e2eState.userId);
      const pendingWithToken = hasInviteAcceptToken();
      const disposableEmail = isDisposableInviteEmail(e2eState.inviteEmail);

      if (acceptCompleted || pendingWithToken || !disposableEmail) {
        test.info().annotations.push({
          type: "invite-cleanup",
          description: acceptCompleted
            ? "accept completed — invitation already used"
            : pendingWithToken
              ? "pending invite with token — no delete"
              : "real inbox invite — no disposable cleanup",
        });
        return;
      }

      const api = new InviteApi(authenticatedApi);
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      try {
        const deleteResponse = await api.deleteInvitation(e2eState.invitationId);
        validation.execute("Invitation By ID Delete", () =>
          validator.validateDeleteInvitationSuccess(
            deleteResponse.rawResponse.status(),
          ),
        );

        printInviteE2eSummary({
          inviteEmail: e2eState.inviteEmail,
          invitationId: e2eState.invitationId,
          role: e2eState.role,
          pendingVerified: true,
          previewVerified: false,
          acceptVerified: false,
          acceptedInListVerified: false,
        });

        validation.finalize("Auth Invite E2E — Cleanup", 0);
      } catch (error) {
        validation.finalize("Auth Invite E2E — Cleanup", 0);
        throw error;
      }
    },
  );
});
