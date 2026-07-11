import { expect } from "@playwright/test";
import { NetworkSearchApi } from "../Api/networksearch.api";
import { NetworkSearchMapper } from "../Mapper/networksearch.mapper";
import { NetworkSearchValidator } from "../Validator/networksearch.validator";
import {
  networkSearchTestCases,
  resolveNetworkSearchQuery,
  type NetworkSearchScenario,
} from "../Data/networksearch.data";
import { registerSearchLookupTests } from "../utils/lookup-catalog.harness";
import { buildQueryString, getLookupResponseData } from "../utils/lookup-spec.harness";
import type { NetworkData } from "../Mapper/networksearch.mapper";

function runNetworkSearchValidations(
  scenario: NetworkSearchScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = NetworkSearchMapper.mapData(
    getLookupResponseData<NetworkData>(responseBody),
  );
  const validator = new NetworkSearchValidator();

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
  validation.execute("Code Rules", () => validator.validateCodeRules(data));

  if (scenario === "edge_limit_one") {
    expect(data.items.length).toBeLessThanOrEqual(1);
  }
}

registerSearchLookupTests({
  describeTitle: "Network Search API",
  testCases: networkSearchTestCases,
  resolveQuery: (scenario) => resolveNetworkSearchQuery(scenario),
  buildPath: (query) =>
    `/indore/utils/search/networks${buildQueryString(query)}`,
  fetch: (authenticatedApi, query) => {
    const api = new NetworkSearchApi(authenticatedApi);
    return api.searchNetworks({
      limit: query.limit as number | undefined,
    });
  },
  validate: runNetworkSearchValidations,
});
