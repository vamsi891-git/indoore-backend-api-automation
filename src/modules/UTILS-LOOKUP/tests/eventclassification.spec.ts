import { EventClassificationApi } from "../Api/eventclassification.api";
import { EventClassificationMapper } from "../Mapper/eventclassification.mapper";
import { EventClassificationValidator } from "../Validator/eventclassification.validator";
import { eventClassificationTestCases } from "../Data/lookup-catalogs.data";
import { registerCatalogLookupTests } from "../utils/lookup-catalog.harness";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import type { CatalogScenario } from "../Data/lookup-catalogs.data";
import type { EventClassificationData } from "../Mapper/eventclassification.mapper";

function validateEventClassification(
  scenario: CatalogScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = EventClassificationMapper.mapData(
    getLookupResponseData<EventClassificationData>(responseBody),
  );
  const validator = new EventClassificationValidator();
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
  if (scenario === "smoke") {
    validation.execute("Expected Values", () =>
      validator.validateExpectedValues(data),
    );
  }
}

registerCatalogLookupTests({
  describeTitle: "Event Classification API",
  endpoint: "/indore/utils/event-classifications",
  testCases: eventClassificationTestCases,
  fetch: (api) => new EventClassificationApi(api).getEventClassifications(),
  validate: validateEventClassification,
});
