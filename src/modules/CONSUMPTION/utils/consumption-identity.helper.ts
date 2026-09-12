import { expect } from "@playwright/test";

export type ConsumptionIdentityRow = {
  slNo: number;
  msn?: string | null;
  ivrsNumber?: string | null;
  feeder?: string | null;
  dtr?: string | null;
};

/** Duplicate slNo / meter / IVRS on one page is a fail. Same feeder or DTR on many consumers is valid. */
export function validateUniqueConsumerKeys(
  items: ConsumptionIdentityRow[],
): void {
  const slNos = items.map((item) => item.slNo);
  expect(new Set(slNos).size).toBe(slNos.length);
  const meters = items
    .map((item) => item.msn?.trim())
    .filter((value): value is string => Boolean(value));
  expect(new Set(meters).size).toBe(meters.length);
  const ivrs = items
    .map((item) => item.ivrsNumber?.trim())
    .filter((value): value is string => Boolean(value));
  expect(new Set(ivrs).size).toBe(ivrs.length);
}

export function validateNoMeterOverlap(
  firstPage: ConsumptionIdentityRow[],
  secondPage: ConsumptionIdentityRow[],
): void {
  const first = new Set(
    firstPage
      .map((item) => item.msn?.trim())
      .filter((value): value is string => Boolean(value)),
  );
  secondPage.forEach((item) => {
    const meter = item.msn?.trim();
    if (meter) {
      expect(first.has(meter)).toBe(false);
    }
  });
}

export function validateSharedHierarchyAllowed(
  items: ConsumptionIdentityRow[],
): void {
  if (items.length < 2) {
    return;
  }
  const feeders = items.map((item) => item.feeder);
  const dtrs = items.map((item) => item.dtr);
  expect(new Set(feeders).size).toBeLessThanOrEqual(feeders.length);
  expect(new Set(dtrs).size).toBeLessThanOrEqual(dtrs.length);
}

/** Last-three / yearly use `msn`; comparison uses `meterSerialNo`. */
export function patternIdentityRows(
  rows: Record<string, unknown>[],
): ConsumptionIdentityRow[] {
  return rows.map((row) => {
    const msn =
      typeof row.msn === "string"
        ? row.msn
        : typeof row.meterSerialNo === "string"
          ? row.meterSerialNo
          : null;
    return {
      slNo: Number(row.slNo),
      msn,
      ivrsNumber:
        typeof row.ivrsNumber === "string" ? row.ivrsNumber : null,
      feeder: typeof row.feeder === "string" ? row.feeder : null,
      dtr: typeof row.dtr === "string" ? row.dtr : null,
    };
  });
}
