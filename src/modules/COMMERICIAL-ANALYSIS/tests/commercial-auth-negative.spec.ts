import { expect } from "@playwright/test";
import { test as authTest } from "../../../fixtures/auth.fixture";
import { commercialSummaryData } from "../Data/commercial-summary.data";
import { pfAnalysisQuery } from "../Data/powerfactor.data";
import { mdAnalysisCdCompareData } from "../Data/mdanalysis.data";
import { lfAnalysisData } from "../Data/loadfactor.api";
import { consumptionCompareLastMonthData } from "../Data/consumptioncompare.data";
import { consumptionPatternData } from "../Data/consumptionpattern.data";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import {
  CommercialCommonValidator,
  commercialAuthData,
  commercialPaths,
  type CommercialErrorBody,
} from "../Validator/commercial-common.validator";

const authEndpoints: Array<{
  name: string;
  path: string;
  params: Record<string, string | number>;
  tags: string[];
}> = [
  {
    name: "Summary",
    path: commercialPaths.summary,
    params: {
      month: commercialSummaryData.month,
      year: commercialSummaryData.year,
      pfThreshold: commercialSummaryData.pfThreshold,
    },
    tags: ["@commercial", "@commercial-summary", "@negative", "@auth"],
  },
  {
    name: "Power Factor",
    path: commercialPaths.pf,
    params: { ...pfAnalysisQuery },
    tags: ["@commercial", "@power-factor", "@negative", "@auth"],
  },
  {
    name: "MD Analysis",
    path: commercialPaths.md,
    params: { ...mdAnalysisCdCompareData },
    tags: ["@commercial", "@md-analysis", "@negative", "@auth"],
  },
  {
    name: "LF Analysis",
    path: commercialPaths.lf,
    params: { ...lfAnalysisData },
    tags: ["@commercial", "@lf-analysis", "@negative", "@auth"],
  },
  {
    name: "Consumption Compare",
    path: commercialPaths.consumptionCompare,
    params: { ...consumptionCompareLastMonthData },
    tags: ["@commercial", "@consumption-compare", "@negative", "@auth"],
  },
  {
    name: "Consumption Pattern",
    path: commercialPaths.consumptionPattern,
    params: { ...consumptionPatternData },
    tags: ["@commercial", "@consumption-pattern", "@negative", "@auth"],
  },
];

authTest.describe("Commercial Analysis API — Auth Negative", () => {
  authTest.setTimeout(120_000);

  for (const endpoint of authEndpoints) {
    authTest(
      `${endpoint.name} rejects missing auth`,
      { tag: endpoint.tags },
      async ({ unauthenticatedApi }) => {
        const validation = new ValidationEngine();
        const rawResponse = await CommercialCommonValidator.getUnauthenticated(
          unauthenticatedApi,
          endpoint.path,
          { params: endpoint.params },
        );
        const body = (await rawResponse
          .json()
          .catch(() => ({}))) as CommercialErrorBody;
        validation.execute("Unauthorized", () =>
          CommercialCommonValidator.validateUnauthorizedError(
            rawResponse.status(),
            body,
          ),
        );
        validation.printSummary(`${endpoint.name} — Missing Auth`, 0);
      },
    );

    authTest(
      `${endpoint.name} rejects invalid bearer token`,
      { tag: endpoint.tags },
      async ({ unauthenticatedApi }) => {
        const validation = new ValidationEngine();
        const rawResponse = await unauthenticatedApi.get(endpoint.path, {
          params: endpoint.params,
          headers: {
            Authorization: commercialAuthData.invalidBearerToken,
          },
        });
        const body = (await rawResponse
          .json()
          .catch(() => ({}))) as CommercialErrorBody;
        validation.execute("Unauthorized / invalid token", () => {
          expect(rawResponse.status()).toBe(401);
          expect(body.success).toBeFalsy();
          expect([
            commercialAuthData.expectedUnauthorizedCode,
            commercialAuthData.expectedInvalidTokenCode,
          ]).toContain(body.error?.code);
        });
        validation.printSummary(`${endpoint.name} — Invalid Token`, 0);
      },
    );
  }

  authTest(
    "Summary rejects disallowed HTTP methods",
    {
      tag: ["@commercial", "@commercial-summary", "@negative", "@auth"],
    },
    async ({ unauthenticatedApi }) => {
      const validation = new ValidationEngine();
      const callers = CommercialCommonValidator.getDisallowedMethodCallers(
        unauthenticatedApi,
        commercialPaths.summary,
      );
      for (const method of commercialAuthData.disallowedMethods) {
        const response = await callers[method]();
        validation.execute(`${method} rejected`, () =>
          CommercialCommonValidator.validateDisallowedMethodRejected(
            response.status(),
          ),
        );
      }
      validation.printSummary("Summary — Disallowed Methods", 0);
    },
  );
});
