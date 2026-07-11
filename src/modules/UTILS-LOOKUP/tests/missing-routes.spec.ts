import { test } from "../../../fixtures/api.fixture";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { UTILS_LOOKUP_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { missingLookupRouteTestCases } from "../Data/lookup-catalogs.data";
import { runLookupApiTest } from "../utils/lookup-spec.harness";

test.describe("UTILS-LOOKUP — missing routes probe", () => {
  test.describe.configure({ retries: 0 });
  test.setTimeout(UTILS_LOOKUP_TEST_TIMEOUT_MS);

  for (const testCase of missingLookupRouteTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        await runLookupApiTest({
          testCase,
          endpoint: testCase.path,
          skipContentTypeCheck: true,
          fetch: async () => {
            const start = Date.now();
            const rawResponse = await getWithAutoRefresh(
              authenticatedApi,
              testCase.path,
            );
            const text = await rawResponse.text();
            let responseBody: unknown = { success: false };
            try {
              responseBody = text ? JSON.parse(text) : responseBody;
            } catch {
              responseBody = { rawHtml: text.slice(0, 200) };
            }
            return {
              rawResponse,
              responseBody,
              responseTime: Date.now() - start,
            };
          },
          onSuccess: ({ validation }) => {
            validation.execute("Unexpected Success", () => {
              throw new Error(
                `Expected ${testCase.expectedStatus} for ${testCase.path}`,
              );
            });
          },
        });
      },
    );
  }
});
