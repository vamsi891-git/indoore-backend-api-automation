import { test } from "../../../fixtures/api.fixture";
import { AssertionEngine } from "../../../core/engine/assertion.engine";
import { ValidationEngine } from "../../../core/engine/validation.engine";
import { BackendResponse } from "../../../core/utils/backend-response.util";
import { PerformanceTracker } from "../../../core/utils/performancetracker";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { DtrBillingApi } from "../Api/dtrbilling.api";
import {
  dtrBillingMaxResponseTimeMs,
  dtrBillingTestCases,
  resolveDtrBillingQuery,
} from "../Data/dtrbilling.data";
import { DtrBillingMapper } from "../Mapper/dtrbilling.mapper";
import {
  DtrBillingValidator,
  type DtrBillingErrorBody,
} from "../Validator/dtrbilling.validator";
import { shouldSkipReportsBackendDefect } from "../utils/reports-env.helper";

test.describe("DTR Billing Report API", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  for (const testCase of dtrBillingTestCases) {
    test(
      testCase.testName,
      { tag: testCase.tags },
      async ({ authenticatedApi }) => {
        if (shouldSkipReportsBackendDefect(testCase.tags)) {
          test.skip(
            true,
            "REPORTS_SKIP_BACKEND_DEFECTS=1 — skipping @backend-defect",
          );
          return;
        }

        const expectedStatus = testCase.expectedStatus ?? 200;
        const validator = new DtrBillingValidator();
        const assert = new AssertionEngine();
        const validation = new ValidationEngine();

        const api = new DtrBillingApi(authenticatedApi);
        const query = resolveDtrBillingQuery(testCase.scenario);

        const { rawResponse, responseBody, responseTime } =
          await api.getDtrBilling(query);

        await PerformanceTracker.track(
          rawResponse,
          testCase.testName,
          rawResponse.url(),
          responseTime,
        );

        if (
          BackendResponse.isServerError(rawResponse.status()) &&
          expectedStatus === 200
        ) {
          BackendResponse.logFinding(
            testCase.testName,
            rawResponse.status(),
            responseBody,
          );
        }

        validation.execute("Status Validation", () =>
          assert.validateStatusCode(
            rawResponse,
            expectedStatus,
            responseBody,
          ),
        );
        validation.execute("Content Type", () =>
          assert.validateContentType(rawResponse),
        );
        validation.execute("Response Time", () =>
          assert.validateResponseTime(
            responseTime,
            dtrBillingMaxResponseTimeMs,
          ),
        );
        validation.execute("Sensitive Data", () =>
          assert.validateSensitiveData(responseBody),
        );

        if (expectedStatus !== 200) {
          validation.execute("Validation Error", () =>
            validator.validateValidationError(
              responseBody as DtrBillingErrorBody,
            ),
          );
          validation.printSummary(testCase.testName, responseTime);
          return;
        }

        validation.execute("Required Fields", () =>
          assert.validateRequiredFields(responseBody, ["success", "data"]),
        );

        const mapped = DtrBillingMapper.map(responseBody);
        const data = mapped.data;
        const rows = data.rows;

        validation.execute("Success", () => validator.validateSuccess(mapped));
        validation.execute("Root Structure", () =>
          validator.validateRootStructure(mapped),
        );
        validation.execute("Columns", () => validator.validateColumns(data));
        validation.execute("Query Echo", () =>
          validator.validateQueryEcho(data, query.page, query.limit),
        );
        validation.execute("Request Date Range Format", () =>
          validator.validateDateRangeFormat(query.fromDate, query.toDate),
        );
        validation.execute("Pagination", () =>
          validator.validatePagination(data, query.includeTotal),
        );
        validation.execute("No Data Scenario", () =>
          validator.validateNoDataScenario(data),
        );
        validation.execute("Rows Present When Total Positive", () =>
          validator.validateRowsPresentWhenTotalPositive(data),
        );

        if (rows.length > 0) {
          validation.execute("Rows Structure", () =>
            validator.validateRowsStructure(rows),
          );
          validation.execute("Hierarchy Fields", () =>
            validator.validateHierarchyFields(rows),
          );
          validation.execute("Meter Serial Number", () =>
            validator.validateMeterSerialNumber(rows),
          );
          validation.execute("Date Time Format", () =>
            validator.validateDateTimeFormat(rows),
          );
          validation.execute("Billing Date In Range", () =>
            validator.validateBillingDateInRange(
              rows,
              query.fromDate,
              query.toDate,
            ),
          );
          validation.execute("Energy Fields", () =>
            validator.validateEnergyFields(rows),
          );
          validation.execute("Electrical Business Rules", () =>
            validator.validateElectricalBusinessRules(rows),
          );
          validation.execute("Export Energy", () =>
            validator.validateExportEnergy(rows),
          );
          validation.execute("MF", () => validator.validateMf(rows));
          validation.execute("SL No Sequence", () =>
            validator.validateSlNoSequence(rows, query.page, query.limit),
          );
          validation.execute("Unique SL No", () =>
            validator.validateUniqueSlNo(rows),
          );
          validation.execute("Unique Meter Serial", () =>
            validator.validateUniqueMeterSerial(rows),
          );
        }

        validation.printSummary(testCase.testName, responseTime);
      },
    );
  }
});
