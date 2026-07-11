import { EventApi } from "../Api/eventapi";
import { EventMapper } from "../Mapper/event.mapper";
import { EventValidator } from "../Validator/event.validator";
import { eventTestCases } from "../Data/lookup-catalogs.data";
import { registerCatalogLookupTests } from "../utils/lookup-catalog.harness";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import type { CatalogScenario } from "../Data/lookup-catalogs.data";
import type { EventData } from "../Mapper/event.mapper";

function validateEvents(
  scenario: CatalogScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = EventMapper.mapData(getLookupResponseData<EventData>(responseBody));
  const validator = new EventValidator();
  validation.execute("Response", () =>
    validator.validateResponse(responseBody as never),
  );
  validation.execute("Items", () => validator.validateItemsExist(data));
  validation.execute("Fields", () => validator.validateFields(data));
  validation.execute("Event Names", () => validator.validateEventNames(data));
  validation.execute("Duplicate IDs", () =>
    validator.validateDuplicateIds(data),
  );
  validation.execute("Reference Tables", () =>
    validator.validateReferenceTables(data),
  );
  if (scenario === "smoke") {
    validation.execute("Known Events", () =>
      validator.validateKnownEvents(data),
    );
  }
}

registerCatalogLookupTests({
  describeTitle: "Events API",
  endpoint: "/indore/utils/events",
  testCases: eventTestCases,
  fetch: (api) => new EventApi(api).getEvents(),
  validate: validateEvents,
});
