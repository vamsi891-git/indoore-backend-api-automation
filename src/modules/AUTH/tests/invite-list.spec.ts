import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { InviteApi } from "../Api/invite.api";
import { InviteTestData } from "../Data/invite.data";
import { InviteMapper } from "../Mapper/invite.mapper";
import { InviteValidator } from "../Validator/invite.validator";
import { SentInvitationsListResponseSchema } from "../schemas/auth.schemas";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { PerformanceTracker } from "../../../core/utils/performancetracker";

test.describe("Auth Sent Invitations List API", () => {
  test.describe.configure({ mode: "serial" });

  for (const status of InviteTestData.listStatuses) {
    test(
      `Validate sent invitations list — status=${status}`,
      { tag: ["@auth", "@invite"] },
      async ({ authenticatedApi }) => {
        const api = new InviteApi(authenticatedApi);
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();
        const validator = new InviteValidator();

        const response = await api.listMyInvitations({
          page: InviteTestData.listPage,
          limit: InviteTestData.listLimit,
          status,
        });

        await PerformanceTracker.track(
          response.rawResponse,
          `Auth Sent Invitations List API (${status})`,
          `${process.env.BASE_URL}/indore/auth/invitations/mine?status=${status}`,
          response.responseTime,
        );

        try {
          validation.execute("List Status", () =>
            assert.validateStatusCode(response.rawResponse, 200),
          );
          validation.execute("List Content Type", () =>
            assert.validateContentType(response.rawResponse),
          );
          validation.execute("List Response Time", () =>
            assert.validateResponseTime(
              response.responseTime,
              InviteTestData.maxResponseTimeMs,
            ),
          );
          validation.execute("List Sensitive Data", () =>
            assert.validateSensitiveData(response.responseBody),
          );

          if (response.rawResponse.status() === 200) {
            validation.execute("List Zod", () => {
              const result = SentInvitationsListResponseSchema.safeParse(
                response.responseBody,
              );
              expect(
                result.success,
                result.success
                  ? "Zod validation passed"
                  : JSON.stringify(result.error?.format(), null, 2),
              ).toBe(true);
            });

            const list = InviteMapper.mapSentInvitationsList(
              SentInvitationsListResponseSchema.parse(response.responseBody),
            );

            validation.execute("Summary Partition", () =>
              validator.validateSummaryPartition(list.summary),
            );
            validation.execute("Filtered Total", () =>
              validator.validateFilteredTotal(list, status),
            );
            validation.execute("Pagination", () =>
              validator.validatePagination(list),
            );
            validation.execute("Filter Options", () =>
              validator.validateFilterOptions(list),
            );
            validation.execute("Filter Roles Catalog", () =>
              validator.validateFilterRolesCatalog(list),
            );
            validation.execute("Created At Desc Order", () =>
              validator.validateCreatedAtDescOrder(list.invitations),
            );
            validation.execute("Invitation Items", () => {
              list.invitations.forEach((item) =>
                validator.validateInvitationItem(item),
              );
            });

            if (status !== "all") {
              validation.execute("Status Filter Query", () =>
                validator.validateStatusFilter(list.invitations, status),
              );
            }
          }
        } finally {
          validation.finalize(
            `Auth Sent Invitations List API (${status})`,
            response.responseTime,
          );
        }
      },
    );
  }

  test(
    "Validate sent invitations list — role filter",
    { tag: ["@auth", "@invite"] },
    async ({ authenticatedApi }) => {
      const api = new InviteApi(authenticatedApi);
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      const baseline = await api.listMyInvitations({
        page: InviteTestData.listPage,
        limit: InviteTestData.listLimit,
        status: "all",
      });

      const baselineList = InviteMapper.mapSentInvitationsList(
        SentInvitationsListResponseSchema.parse(baseline.responseBody),
      );
      const role = baselineList.filterOptions.roles[0];
      test.skip(!role, "No invitation roles available for role filter test");

      const response = await api.listMyInvitations({
        page: InviteTestData.listPage,
        limit: InviteTestData.listLimit,
        status: "all",
        role,
      });

      try {
        const list = InviteMapper.mapSentInvitationsList(
          SentInvitationsListResponseSchema.parse(response.responseBody),
        );

        validation.execute("Role Filter Status", () =>
          expect(response.rawResponse.status()).toBe(200),
        );
        validation.execute("Role Filter Items", () =>
          validator.validateRoleFilter(list.invitations, role!),
        );
        validation.execute("Role Filter Total", () => {
          expect(list.invitations.length).toBeLessThanOrEqual(list.total);
          if (list.total > 0) {
            expect(list.invitations.length).toBeGreaterThan(0);
          }
        });
      } finally {
        validation.finalize(
          `Auth Sent Invitations List API (role=${role})`,
          response.responseTime,
        );
      }
    },
  );

  test(
    "Validate sent invitations list — email search",
    { tag: ["@auth", "@invite"] },
    async ({ authenticatedApi }) => {
      const api = new InviteApi(authenticatedApi);
      const validation = new ValidationEngine();
      const validator = new InviteValidator();

      const baseline = await api.listMyInvitations({
        page: InviteTestData.listPage,
        limit: InviteTestData.listLimit,
        status: "all",
      });

      const baselineList = InviteMapper.mapSentInvitationsList(
        SentInvitationsListResponseSchema.parse(baseline.responseBody),
      );
      const sampleEmail = baselineList.invitations[0]?.email;
      test.skip(!sampleEmail, "No invitations available for email search test");

      const query = sampleEmail!.split("@")[0]!.slice(0, 8);
      const response = await api.listMyInvitations({
        page: InviteTestData.listPage,
        limit: InviteTestData.listLimit,
        status: "all",
        q: query,
      });

      try {
        const list = InviteMapper.mapSentInvitationsList(
          SentInvitationsListResponseSchema.parse(response.responseBody),
        );

        validation.execute("Email Search Status", () =>
          expect(response.rawResponse.status()).toBe(200),
        );
        validation.execute("Email Search Items", () =>
          validator.validateEmailSearch(list.invitations, query),
        );
        validation.execute("Email Search Contains Sample", () => {
          const found = list.invitations.some((item) =>
            InviteMapper.emailsMatch(item.email, sampleEmail!),
          );
          expect(found).toBe(true);
        });
      } finally {
        validation.finalize(
          `Auth Sent Invitations List API (q=${query})`,
          response.responseTime,
        );
      }
    },
  );
});
