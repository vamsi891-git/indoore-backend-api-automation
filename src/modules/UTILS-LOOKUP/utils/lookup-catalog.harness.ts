import { test } from "../../../fixtures/api.fixture";
import { UTILS_LOOKUP_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import type { APIRequestContext } from "@playwright/test";
import {
  runLookupApiTest,
  type LookupApiResult,
  type LookupTestCase,
} from "./lookup-spec.harness";

export function registerCatalogLookupTests<
  T extends LookupTestCase & { scenario: string },
>(options: {
  describeTitle: string;
  testCases: T[];
  fetch: (authenticatedApi: APIRequestContext) => Promise<LookupApiResult>;
  validate: (
    scenario: T["scenario"],
    responseBody: unknown,
    validation: import("../../../core/engine/validation.engine").ValidationEngine,
  ) => void;
}): void {
  test.describe(options.describeTitle, () => {
    test.describe.configure({ mode: "serial", retries: 1 });
    test.setTimeout(UTILS_LOOKUP_TEST_TIMEOUT_MS);

    for (const testCase of options.testCases) {
      test(
        testCase.testName,
        { tag: testCase.tags },
        async ({ authenticatedApi }) => {
          await runLookupApiTest({
            testCase,
            fetch: () => options.fetch(authenticatedApi),
            onSuccess: ({ validation, responseBody }) => {
              options.validate(testCase.scenario, responseBody, validation);
            },
          });
        },
      );
    }
  });
}

export function registerSearchLookupTests<
  T extends LookupTestCase & { scenario: string },
  Q,
>(options: {
  describeTitle: string;
  testCases: T[];
  resolveQuery: (scenario: T["scenario"]) => Q;
  fetch: (
    authenticatedApi: APIRequestContext,
    query: Q,
  ) => Promise<LookupApiResult>;
  validate: (
    scenario: T["scenario"],
    responseBody: unknown,
    validation: import("../../../core/engine/validation.engine").ValidationEngine,
  ) => void;
}): void {
  test.describe(options.describeTitle, () => {
    test.describe.configure({ mode: "serial", retries: 1 });
    test.setTimeout(UTILS_LOOKUP_TEST_TIMEOUT_MS);

    for (const testCase of options.testCases) {
      test(
        testCase.testName,
        { tag: testCase.tags },
        async ({ authenticatedApi }) => {
          const query = options.resolveQuery(testCase.scenario);
          await runLookupApiTest({
            testCase,
            fetch: () => options.fetch(authenticatedApi, query),
            onSuccess: ({ validation, responseBody }) => {
              options.validate(testCase.scenario, responseBody, validation);
            },
          });
        },
      );
    }
  });
}
