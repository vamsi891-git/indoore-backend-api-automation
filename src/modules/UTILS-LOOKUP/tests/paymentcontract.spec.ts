import { PaymentContractApi } from "../Api/paymentcontract.api";
import { PaymentContractMapper } from "../Mapper/paymentcontract.mapper";
import { PaymentContractValidator } from "../Validator/paymentcontract.validator";
import { paymentContractTestCases } from "../Data/lookup-catalogs.data";
import { registerCatalogLookupTests } from "../utils/lookup-catalog.harness";
import { getLookupResponseData } from "../utils/lookup-spec.harness";
import type { CatalogScenario } from "../Data/lookup-catalogs.data";
import type { PaymentContractData } from "../Mapper/paymentcontract.mapper";

function validatePaymentContract(
  scenario: CatalogScenario,
  responseBody: unknown,
  validation: import("../../../core/engine/validation.engine").ValidationEngine,
): void {
  const data = PaymentContractMapper.mapData(
    getLookupResponseData<PaymentContractData>(responseBody),
  );
  const validator = new PaymentContractValidator();
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
  validation.execute("Duplicate Codes", () =>
    validator.validateDuplicateCodes(data),
  );
  validation.execute("Backend Rules", () =>
    validator.validateBackendRules(data),
  );
  if (scenario === "smoke") {
    validation.execute("Expected Values", () =>
      validator.validateExpectedValues(data),
    );
  }
}

registerCatalogLookupTests({
  describeTitle: "Payment Contract API",
  endpoint: "/indore/utils/payment-contracts",
  testCases: paymentContractTestCases,
  fetch: (api) => new PaymentContractApi(api).getPaymentContracts(),
  validate: validatePaymentContract,
});
