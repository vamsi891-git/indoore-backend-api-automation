import { expect } from "@playwright/test";
import { SearchConsumerApi } from "../Api/consumersearch.api";
import { SearchConsumerMapper } from "../Mapper/consumersearch.mapper";
import { SearchConsumerValidator } from "../Validator/consumersearch.validator";
import {
  consumerSearchTestCases,
  resolveConsumerSearchQuery,
  type ConsumerSearchScenario,
} from "../Data/consumersearch.data";
import { registerSearchLookupTests } from "../utils/lookup-catalog.harness";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import type { SearchConsumerRawData } from "../Mapper/consumersearch.mapper";

function runConsumerSearchValidations(
  scenario: ConsumerSearchScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const raw = getLookupResponseData<SearchConsumerRawData>(responseBody);
  const data = SearchConsumerMapper.mapData(raw);
  const validator = new SearchConsumerValidator();

  validation.execute("Response", () =>
    validator.validateResponse(responseBody as never),
  );
  validation.execute("Columns", () => validator.validateColumns(raw.columns));
  validation.execute("Pagination", () => validator.validatePagination(data));

  if (scenario === "edge_page_beyond") {
    validation.execute("Empty Page", () => validator.validateEmptyPage(data));
    return;
  }

  if (scenario === "edge_page_two") {
    validation.execute("Page Two", () => {
      expect(data.page).toBe(2);
      validator.validatePagination(data);
      if (data.items.length === 0) {
        validator.validateEmptyPage(data);
        return;
      }
      validator.validateSerialSequence(data);
    });
    return;
  }

  if (scenario === "edge_limit_one") {
    validation.execute("Limit One", () => validator.validateLimitOne(data));
    return;
  }

  if (data.items.length === 0) {
    return;
  }

  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Required Fields", () =>
    validator.validateRequiredFields(data),
  );
  validation.execute("Data Types", () => validator.validateDataTypes(data));
  validation.execute("Serial Sequence", () =>
    validator.validateSerialSequence(data),
  );
  validation.execute("Duplicate Meter Serial", () =>
    validator.validateDuplicateMeterSerials(data),
  );
  validation.execute("Mobile Format", () =>
    validator.validateMobileNumberFormat(data),
  );
  validation.execute("IVRS Fields", () => validator.validateIvrsFields(data));
}

registerSearchLookupTests({
  describeTitle: "Consumer search",
  testCases: consumerSearchTestCases,
  resolveQuery: resolveConsumerSearchQuery,
  fetch: (authenticatedApi, query) =>
    new SearchConsumerApi(authenticatedApi).searchConsumers(query),
  validate: runConsumerSearchValidations,
});
