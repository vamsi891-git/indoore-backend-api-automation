import { expect } from "@playwright/test";
import { test } from "../../../fixtures/auth.fixture";
import { InvitePublicApi } from "../Api/invite.api";
import { InviteTestData } from "../Data/invite.data";
import { AuthMapper } from "../Mapper/auth.mapper";
import { InviteValidator } from "../Validator/invite.validator";
import {
  AuthErrorResponseSchema,
  InviteAcceptRequestSchema,
} from "../schemas/auth.schemas";
import { AuthenticationApi } from "../Api/auth.api";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";

test.describe("Auth Invite Accept API", () => {
  test(
    "Reject invalid invitation token on accept",
    { tag: ["@auth", "@invite"] },
    async ({ unauthenticatedApi }) => {
      const publicApi = new InvitePublicApi(unauthenticatedApi);
      const authApi = new AuthenticationApi(unauthenticatedApi);
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      const preflight = await authApi.getLoginPreflight();
      const csrfToken = await AuthMapper.resolveCsrfToken(
        unauthenticatedApi,
        preflight.rawResponse.headers(),
      );

      const acceptPayload = {
        token: InviteTestData.invalidPreviewToken,
        ...InviteTestData.acceptPayload,
      };

      try {
        validation.execute("Accept Request Schema", () => {
          expect(InviteAcceptRequestSchema.safeParse(acceptPayload).success).toBe(
            true,
          );
        });

        const accept = await publicApi.acceptInvitation(
          acceptPayload,
          csrfToken,
        );

        validation.execute("Invalid Accept Contract", () =>
          validator.validateAcceptInvalid(
            accept.rawResponse.status(),
            accept.responseBody,
            InviteTestData.acceptErrorCodes.invalid,
          ),
        );
        validation.execute("Invalid Accept Zod", () => {
          const result = AuthErrorResponseSchema.safeParse(accept.responseBody);
          expect(result.success).toBe(true);
          expect(result.data?.error.code).toBe(
            InviteTestData.acceptErrorCodes.invalid,
          );
        });
      } finally {
        validation.finalize("Auth Invite Accept API", preflight.responseTime);
      }
    },
  );
});
