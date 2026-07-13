import { EventPriorityApi } from "../Api/eventpriority.api";
import { EventPriorityMapper } from "../Mapper/eventpriority.mapper";
import { EventPriorityValidator } from "../Validator/eventpriority.validator";
import { eventPriorityTestCases } from "../Data/lookup-catalogs.data";
import { registerCatalogLookupTests } from "../utils/lookup-catalog.harness";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import type { CatalogScenario } from "../Data/lookup-catalogs.data";
import type { EventPriorityData } from "../Mapper/eventpriority.mapper";

function validateEventPriority(
  scenario: CatalogScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = EventPriorityMapper.mapData(
    getLookupResponseData<EventPriorityData>(responseBody),
  );
  const validator = new EventPriorityValidator();
  validation.execute("Response", () =>
    validator.validateResponse(responseBody as never),
  );
  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Fields", () => validator.validateFields(data));
  validation.execute("Duplicate Priorities", () =>
    validator.validateDuplicatePriorities(data),
  );
  validation.execute("Ascending Order", () =>
    validator.validateAscendingOrder(data),
  );
  if (scenario === "smoke") {
    validation.execute("Expected Values", () =>
      validator.validateExpectedValues(data),
    );
  }
}

registerCatalogLookupTests({
  describeTitle: "Event Priority API",
  testCases: eventPriorityTestCases,
  fetch: (api) => new EventPriorityApi(api).getEventPriorities(),
  validate: validateEventPriority,
});
