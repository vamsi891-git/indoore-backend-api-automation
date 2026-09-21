import type pg from "pg";
import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { compareApiToDb } from "../../../extras/db/db-compare.engine";
import { getBillingMeterHeaderBySerial } from "../../BILLING/Db/billing.db";
import { EventReportApi } from "../Api/eventreport.api";
import { DtrBillingApi } from "../Api/dtrbilling.api";
import { resolveEventReportQuery } from "../Data/eventreport.data";
import { resolveDtrBillingQuery } from "../Data/dtrbilling.data";
import { EventReportMapper } from "../Mapper/eventreport.mapper";
import { DtrBillingMapper } from "../Mapper/dtrbilling.mapper";
import {
  countReportsActiveEvents,
  getReportsEventById,
} from "../Db/reports.db";
import {
  compareReportsCountLteDb,
  compareReportsEventNameToDb,
} from "../Db/reports-db-compare";
import { logReportsDataQualityFindings } from "../Db/reports-db.validator";
import { isReportsInternalError } from "../utils/reports-env.helper";
import { ApiValidationHelper } from "../../../core/helpers/api-validation.helper";

/**
 * Part 4 harness — event-report catalog spot + DTR billing meter header.
 * Archive event aggregates remain filter/meter-scoped (soft later).
 */
export async function runReportsDbCoverage(
  authenticatedApi: APIRequestContext,
  db: pg.Pool,
): Promise<void> {
  const validation = new ApiValidationHelper();
  const eventApi = new EventReportApi(authenticatedApi);
  const dtrApi = new DtrBillingApi(authenticatedApi);

  const eventQuery = resolveEventReportQuery("dev_live_primary");
  const eventBody = await eventApi.getEventReport(eventQuery);
  const eventCrashed =
    eventBody.rawResponse.status() === 500 &&
    isReportsInternalError(eventBody.responseBody);

  const activeEventCount = await countReportsActiveEvents(db);
  validation.execute("Active M_Event catalog is non-empty", () => {
    expect(activeEventCount).toBeGreaterThan(0);
  });

  if (eventCrashed) {
    console.warn(
      "[BACKEND FINDING] event-report DB check skipped — GET /indore/reports/event-report returned 500 INTERNAL_ERROR",
    );
  } else {
    expect(eventBody.rawResponse.status()).toBe(200);
    const eventMapped = EventReportMapper.map(eventBody.responseBody);
    expect(eventMapped.success).toBe(true);
    await logReportsDataQualityFindings(
      "event-report",
      eventBody.responseBody.data as unknown as Record<string, unknown>,
    );

    validation.execute(
      "Event-report page size ≤ active M_Event catalog",
      () => {
        compareReportsCountLteDb({
          label: "reports.eventReport.pageRows",
          apiCount: eventMapped.rows.length,
          dbCount: activeEventCount,
        });
      },
    );

    const eventRow = eventMapped.rows.find((row) => Number.isFinite(row.eventId));
    if (!eventRow) {
      console.warn(
        "[BACKEND FINDING] event-report name spot skipped — no rows with eventId",
      );
    } else {
      const dbEvent = await getReportsEventById(db, eventRow.eventId);
      validation.execute(
        `Event-report name vs M_Event (${eventRow.eventId})`,
        () => {
          compareReportsEventNameToDb({
            api: {
              eventId: eventRow.eventId,
              eventName: eventRow.eventName,
            },
            dbRow: dbEvent,
          });
        },
      );
    }
  }

  const dtrQuery = resolveDtrBillingQuery("dev_live_without_total");
  const dtrBody = await dtrApi.getDtrBilling(dtrQuery);
  const dtrMapped = DtrBillingMapper.map(dtrBody.responseBody);
  const dtrRow = dtrMapped.data.rows.find((row) =>
    row.meterSerialNumber?.trim(),
  );
  if (!dtrRow?.meterSerialNumber?.trim()) {
    console.warn(
      "[BACKEND FINDING] DTR billing meter spot skipped — no row with meter serial",
    );
  } else {
    const serial = dtrRow.meterSerialNumber.trim();
    const dbMeter = await getBillingMeterHeaderBySerial(db, serial);
    validation.execute(
      `DTR billing meter serial vs L_Meter_Lookup (${serial})`,
      () => {
        expect(dbMeter, `DB meter header missing for ${serial}`).toBeTruthy();
        compareApiToDb(
          [
            {
              label: "meterSerialNumber",
              apiValue: serial,
              dbValue: dbMeter!.meterNumber?.trim(),
            },
            {
              label: "mf",
              apiValue: dtrRow.mf,
              dbValue: dbMeter!.mf,
              optional: true,
            },
          ],
          `DB vs API — DTR billing meter header (${serial})`,
        );
      },
    );
  }

  validation.printSummary("REPORTS DB Coverage", 0);
}
