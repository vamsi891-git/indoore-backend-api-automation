import { OrganizationApi } from "../Api/searchorganization.api";
import { OrganizationMapper } from "../Mapper/searchorganization.mapper";
import { OrganizationValidator } from "../Validator/searchorganization.validator";
import {
  organizationSearchTestCases,
  resolveOrganizationSearchQuery,
  type OrganizationSearchScenario,
} from "../Data/searchorganization.data";
import { registerSearchLookupTests } from "../utils/lookup-catalog.harness";
import { buildQueryString, getLookupResponseData } from "../utils/lookup-spec.harness";
import type { OrganizationData } from "../Mapper/searchorganization.mapper";
import { expect } from "@playwright/test";

function runOrganizationSearchValidations(
  scenario: OrganizationSearchScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = OrganizationMapper.mapData(
    getLookupResponseData<OrganizationData>(responseBody),
  );
  const validator = new OrganizationValidator();

  validation.execute("Response", () =>
    validator.validateResponse(responseBody as never),
  );
  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Fields", () => validator.validateFields(data));
  validation.execute("Duplicate IDs", () =>
    validator.validateDuplicateIds(data),
  );
  validation.execute("Backend Rules", () =>
    validator.validateBackendRules(data),
  );
  validation.execute("Code Format", () => validator.validateCodeFormat(data));

  if (scenario === "edge_limit_one") {
    validation.execute("Limit One", () => {
      expect(data.items.length).toBeLessThanOrEqual(1);
    });
  }
}

registerSearchLookupTests({
  describeTitle: "Organisation Search API",
  testCases: organizationSearchTestCases,
  resolveQuery: (scenario) => resolveOrganizationSearchQuery(scenario),
  buildPath: (query) =>
    `/indore/utils/search/organisations${buildQueryString(query)}`,
  fetch: (authenticatedApi, query) => {
    const api = new OrganizationApi(authenticatedApi);
    return api.searchOrganizations({
      limit: query.limit as number | undefined,
    });
  },
  validate: runOrganizationSearchValidations,
});
