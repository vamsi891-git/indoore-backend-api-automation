import { ConsumerCategoryApi } from "../Api/consumercategory.api";
import { ConsumerCategoryMapper } from "../Mapper/consumercategory.mapper";
import { ConsumerCategoryValidator } from "../Validator/consumercategory.validator";
import { consumerCategoryTestCases } from "../Data/lookup-catalogs.data";
import { registerCatalogLookupTests } from "../utils/lookup-catalog.harness";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import type { CatalogScenario } from "../Data/lookup-catalogs.data";
import type { ConsumerCategoryData } from "../Mapper/consumercategory.mapper";

function validateConsumerCategory(
  scenario: CatalogScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = ConsumerCategoryMapper.mapData(
    getLookupResponseData<ConsumerCategoryData>(responseBody),
  );
  const validator = new ConsumerCategoryValidator();
  validation.execute("Response", () =>
    validator.validateResponse(responseBody as never),
  );
  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Fields", () => validator.validateFields(data));
  validation.execute("Duplicate IDs", () =>
    validator.validateDuplicateIds(data),
  );
  validation.execute("Duplicate Names", () =>
    validator.validateDuplicateNames(data),
  );
  validation.execute("Duplicate Short Names", () =>
    validator.validateDuplicateShortNames(data),
  );
  validation.execute("Ascending Order", () =>
    validator.validateAscendingOrder(data),
  );
  if (scenario === "smoke") {
    validation.execute("Expected Categories", () =>
      validator.validateExpectedCategories(data),
    );
  }
}

registerCatalogLookupTests({
  describeTitle: "Consumer Category API",
  endpoint: "/indore/utils/consumer-categories",
  testCases: consumerCategoryTestCases,
  fetch: (api) => new ConsumerCategoryApi(api).getConsumerCategories(),
  validate: validateConsumerCategory,
});
