import { MeterPhaseApi } from "../Api/meterphase.api";
import { MeterPhaseMapper } from "../Mapper/meterphase.mapper";
import { MeterPhaseValidator } from "../Validator/meterphase.validator";
import { meterPhaseTestCases } from "../Data/lookup-catalogs.data";
import { registerCatalogLookupTests } from "../utils/lookup-catalog.harness";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import type { CatalogScenario } from "../Data/lookup-catalogs.data";
import type { MeterPhaseData } from "../Mapper/meterphase.mapper";

function validateMeterPhase(
  scenario: CatalogScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = MeterPhaseMapper.mapData(
    getLookupResponseData<MeterPhaseData>(responseBody),
  );
  const validator = new MeterPhaseValidator();
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
    validation.execute("Expected Phases", () =>
      validator.validateExpectedPhases(data),
    );
  }
}

registerCatalogLookupTests({
  describeTitle: "Meter Phase API",
  testCases: meterPhaseTestCases,
  fetch: (api) => new MeterPhaseApi(api).getMeterPhases(),
  validate: validateMeterPhase,
});
