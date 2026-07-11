import { DtrSearchApi } from "../Api/dtrsearch.api";
import { DtrSearchMapper } from "../Mapper/dtrsearch.mapper";
import { DtrSearchValidator } from "../Validator/dtrsearch.validator";
import {
  dtrSearchTestCases,
  resolveDtrSearchQuery,
  type DtrSearchScenario,
} from "../Data/dtrsearch.data";
import { registerSearchLookupTests } from "../utils/lookup-catalog.harness";
import { buildQueryString, getLookupResponseData } from "../utils/lookup-spec.harness";
import type { DtrSearchRawData } from "../Mapper/dtrsearch.mapper";

function runDtrSearchValidations(
  scenario: DtrSearchScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = DtrSearchMapper.mapData(
    getLookupResponseData<DtrSearchRawData>(responseBody),
  );
  const validator = new DtrSearchValidator();

  validation.execute("Response", () =>
    validator.validateResponse(responseBody as never),
  );
  validation.execute("Pagination", () => validator.validatePagination(data));

  if (scenario === "edge_page_beyond") {
    validation.execute("Empty Page", () => validator.validateEmptyPage(data));
    return;
  }

  if (scenario === "edge_limit_one") {
    validation.execute("Limit One", () => validator.validateLimitOne(data));
    return;
  }

  if (data.item.length === 0) {
    return;
  }

  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Serial Numbers", () =>
    validator.validateSerialNumbers(data),
  );
  validation.execute("Required Fields", () =>
    validator.validateRequiredFields(data),
  );
  validation.execute("Data Types", () => validator.validateDataTypes(data));
  validation.execute("Meter Serial", () =>
    validator.validateMeterSerialNumbers(data),
  );
  validation.execute("Duplicate Meter", () =>
    validator.validateDuplicateMeterSerials(data),
  );
  validation.execute("Coordinates", () => validator.validateCoordinates(data));
  validation.execute("MF", () => validator.validateMF(data));
  validation.execute("Business Rules", () =>
    validator.validateBusinessRules(data),
  );
  validation.execute("Page Aggregation", () =>
    validator.validatePageAggregation(data),
  );
}

registerSearchLookupTests({
  describeTitle: "DTR Search API",
  testCases: dtrSearchTestCases,
  resolveQuery: (scenario) => resolveDtrSearchQuery(scenario),
  buildPath: (query) => `/indore/utils/search/dtr${buildQueryString(query)}`,
  fetch: (authenticatedApi, query) => {
    const api = new DtrSearchApi(authenticatedApi);
    return api.searchDtr({
      page: query.page as number | undefined,
      limit: query.limit as number | undefined,
    });
  },
  validate: runDtrSearchValidations,
});
