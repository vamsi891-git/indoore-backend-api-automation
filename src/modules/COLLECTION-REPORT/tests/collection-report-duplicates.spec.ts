import { expect } from "@playwright/test";
import { test } from "../../../fixtures/api.fixture";
import { MASTER_DATA_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";
import { CollectionReportApi } from "../Api/collection-report.api";
import {
  collectionReportDefaultFromDate,
  collectionReportDefaultToDate,
  collectionReportDefaultImbalanceThreshold,
  collectionReportDefaultCurrentMismatchThreshold,
  collectionReportDefaultLowConsumptionThreshold,
  collectionReportMaxResponseTimeMs,
} from "../Data/collection-report.data";
import { CollectionReportMapper } from "../Mapper/collection-report.mapper";
import { CollectionReportValidator } from "../Validator/collection-report.validator";
import { skipIfCollectionReportUnavailable } from "../utils/collection-report-env.helper";

/**
 * Cross-page / keyset duplicate checks for current-mismatch.
 * Offset page 2 and archive keyset (afterMeterLookupId) must not repeat meters.
 */
test.describe("Collection report — duplicate meter validation", () => {
  test.describe.configure({ retries: 0 });
  test.setTimeout(MASTER_DATA_TEST_TIMEOUT_MS);

  test(
    "current-mismatch page 1 vs page 2 share no meterLookupId",
    {
      tag: ["@collection-report", "@duplicates", "@edge", "@current-mismatch"],
    },
    async ({ authenticatedApi }) => {
      const api = new CollectionReportApi(authenticatedApi);
      const validator = new CollectionReportValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      const base = {
        reportType: "current-mismatch" as const,
        fromDate: collectionReportDefaultFromDate,
        toDate: collectionReportDefaultToDate,
        imbalanceThreshold: collectionReportDefaultImbalanceThreshold,
        currentMismatchThreshold: collectionReportDefaultCurrentMismatchThreshold,
        lowConsumptionThreshold: collectionReportDefaultLowConsumptionThreshold,
        limit: 10,
      };

      const page1 = await api.getCollectionReport({ ...base, page: 1 });
      skipIfCollectionReportUnavailable(page1.rawResponse.status(), page1.responseBody);
      const page2 = await api.getCollectionReport({ ...base, page: 2 });
      skipIfCollectionReportUnavailable(page2.rawResponse.status(), page2.responseBody);

      assert.validateStatusCode(page1.rawResponse, 200, page1.responseBody);
      assert.validateStatusCode(page2.rawResponse, 200, page2.responseBody);
      assert.validateResponseTime(page1.responseTime, collectionReportMaxResponseTimeMs);

      const mapped1 = CollectionReportMapper.map(page1.responseBody);
      const mapped2 = CollectionReportMapper.map(page2.responseBody);

      validation.execute("Page1 live ok", () =>
        validator.validateLiveOk(mapped1, "current-mismatch", 1, 10),
      );
      validation.execute("Page2 live ok", () =>
        validator.validateLiveOk(mapped2, "current-mismatch", 2, 10),
      );

      if (mapped1.rows.length === 0 || mapped2.rows.length === 0) {
        test.info().annotations.push({
          type: "note",
          description: "One page returned no matching rows; skip cross-page overlap assert",
        });
        validation.printSummary(
          "current-mismatch page overlap",
          page1.responseTime + page2.responseTime,
        );
        return;
      }

      validation.execute("No cross-page meterLookupId overlap", () =>
        validator.validateNoOverlapAcrossPages(mapped1.rows, mapped2.rows),
      );
      validation.printSummary(
        "current-mismatch page overlap",
        page1.responseTime + page2.responseTime,
      );
    },
  );

  test(
    "current-mismatch keyset after nextMeterLookupId shares no meterLookupId with page 1",
    {
      tag: ["@collection-report", "@duplicates", "@edge", "@current-mismatch"],
    },
    async ({ authenticatedApi }) => {
      const api = new CollectionReportApi(authenticatedApi);
      const validator = new CollectionReportValidator();
      const assert = new ApiValidationHelper();
      const validation = new ApiValidationHelper();

      const base = {
        reportType: "current-mismatch" as const,
        fromDate: collectionReportDefaultFromDate,
        toDate: collectionReportDefaultToDate,
        imbalanceThreshold: collectionReportDefaultImbalanceThreshold,
        currentMismatchThreshold: collectionReportDefaultCurrentMismatchThreshold,
        lowConsumptionThreshold: collectionReportDefaultLowConsumptionThreshold,
        limit: 10,
        page: 1,
      };

      const first = await api.getCollectionReport(base);
      skipIfCollectionReportUnavailable(first.rawResponse.status(), first.responseBody);
      assert.validateStatusCode(first.rawResponse, 200, first.responseBody);
      const mapped1 = CollectionReportMapper.map(first.responseBody);
      validator.validateLiveOk(mapped1, "current-mismatch", 1, 10);

      if (mapped1.nextMeterLookupId == null || mapped1.hasMore !== true) {
        test.skip(true, "No nextMeterLookupId / hasMore from first page — cannot keyset");
        return;
      }

      const second = await api.getCollectionReport({
        ...base,
        afterMeterLookupId: mapped1.nextMeterLookupId,
      });
      skipIfCollectionReportUnavailable(second.rawResponse.status(), second.responseBody);
      assert.validateStatusCode(second.rawResponse, 200, second.responseBody);
      const mapped2 = CollectionReportMapper.map(second.responseBody);
      validator.validateLiveOk(mapped2, "current-mismatch", 1, 10);

      if (mapped2.rows.length > 0) {
        expect(
          mapped2.rows.every((r) => Number(r.meterLookupId) > Number(mapped1.nextMeterLookupId)),
        ).toBeTruthy();
      }

      if (mapped1.rows.length > 0 && mapped2.rows.length > 0) {
        validation.execute("No keyset meterLookupId overlap", () =>
          validator.validateNoOverlapAcrossPages(mapped1.rows, mapped2.rows),
        );
      }

      validation.printSummary(
        "current-mismatch keyset overlap",
        first.responseTime + second.responseTime,
      );
    },
  );

  test(
    "neutral-zero and current-mismatch rows are unique within each response",
    {
      tag: ["@collection-report", "@duplicates", "@smoke"],
    },
    async ({ authenticatedApi }) => {
      const api = new CollectionReportApi(authenticatedApi);
      const validator = new CollectionReportValidator();
      const assert = new ApiValidationHelper();

      const shared = {
        fromDate: collectionReportDefaultFromDate,
        toDate: collectionReportDefaultToDate,
        imbalanceThreshold: collectionReportDefaultImbalanceThreshold,
        currentMismatchThreshold: collectionReportDefaultCurrentMismatchThreshold,
        lowConsumptionThreshold: collectionReportDefaultLowConsumptionThreshold,
        page: 1,
        limit: 20,
      };

      for (const reportType of [
        "current-mismatch",
        "neutral-zero-phase-current",
        "no-load",
      ] as const) {
        const result = await api.getCollectionReport({
          ...shared,
          reportType,
        });
        skipIfCollectionReportUnavailable(result.rawResponse.status(), result.responseBody);
        assert.validateStatusCode(result.rawResponse, 200, result.responseBody);
        const mapped = CollectionReportMapper.map(result.responseBody);
        validator.validateLiveOk(mapped, reportType, 1, 20);
        if (mapped.rows.length > 0) {
          validator.validateNoDuplicateMeters(mapped.rows);
        }
      }
    },
  );
});
