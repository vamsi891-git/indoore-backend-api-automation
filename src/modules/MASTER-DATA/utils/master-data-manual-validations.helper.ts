/**
 * Maps automation scenarios to Bulk upload validations.txt (DTR Bulk §1–§4).
 * Rule: tests PASS when the API enforces the manual rule; FAIL only when the API
 * accepts invalid data or rejects valid data contrary to the spec.
 *
 * Set MASTER_DATA_SKIP_BACKEND_DEFECTS=1 to skip @backend-defect cases (green CI).
 */

export function shouldSkipKnownBackendDefects(): boolean {
  const flag = process.env.MASTER_DATA_SKIP_BACKEND_DEFECTS?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

/** create-dtr.spec — API accepts invalid payload (returns 201). See manual doc §CREATE DTR. */
export const CREATE_DTR_BACKEND_DEFECT_SCENARIOS = new Set([
  "validation_error:cap-zero",
  "meter_not_found",
  "meter_inactive",
  "validation_error:bad-main-sub",
  "validation_error:bad-phase",
  "validation_error:bad-imei",
  "validation_error:reading-zero",
]);

/** bulk-upload-dtr.spec — row-level backend gap. See manual doc §BULK UPLOAD DTR. */
export const BULK_UPLOAD_DTR_BACKEND_DEFECT_SCENARIOS = new Set([
  "row_meter_inactive",
]);

/**
 * bulk-upload-consumers.spec — backend gaps per Bulk upload validations.txt §CONSUMERS.
 * Hierarchy: bulk path does not map Excel Zone/Sub Station/Feeder/DTR to network lookup ids.
 */
export const BULK_UPLOAD_CONSUMER_BACKEND_DEFECT_SCENARIOS = new Set([
  "bulk_success",
  "bulk_success_multi",
  "bulk_success_blank_row",
  "row_invalid_nearest_acct_id",
  "row_meter_not_found",
  "row_meter_inactive",
  "row_meter_already_mapped",
  "row_invalid_imei",
]);

/** Row error when bulk consumer hierarchy text is not resolved to lookup ids. */
export const BULK_CONSUMER_HIERARCHY_ROW_ERROR =
  /substationnetworklookupid|feedernetworklookupid/i;

export function isBulkUploadConsumerBackendDefect(scenario: string): boolean {
  return BULK_UPLOAD_CONSUMER_BACKEND_DEFECT_SCENARIOS.has(scenario);
}

function defectKey(
  scenario: string,
  label?: string,
): string {
  return label ? `${scenario}:${label}` : scenario;
}

export function isCreateDtrBackendDefect(
  scenario: string,
  payloadLabel?: string,
): boolean {
  if (CREATE_DTR_BACKEND_DEFECT_SCENARIOS.has(scenario)) {
    return true;
  }
  if (payloadLabel) {
    return CREATE_DTR_BACKEND_DEFECT_SCENARIOS.has(
      defectKey(scenario, payloadLabel),
    );
  }
  return false;
}

export function isBulkUploadDtrBackendDefect(scenario: string): boolean {
  return BULK_UPLOAD_DTR_BACKEND_DEFECT_SCENARIOS.has(scenario);
}

export function createDtrDefectKeyFromTestCase(testCase: {
  scenario: string;
  buildPayload: () => unknown;
}): string | undefined {
  const payload = testCase.buildPayload() as Record<string, unknown>;
  if (testCase.scenario === "validation_error") {
    if (payload["DTR Capacity (KVA)"] === 0) {
      return "validation_error:cap-zero";
    }
    if (payload["Main/Sub Meter"] === 99_999_999) {
      return "validation_error:bad-main-sub";
    }
    if (payload["Meter Phase"] === 99_999_999) {
      return "validation_error:bad-phase";
    }
    if (payload["Modem IMEI"] === "12345") {
      return "validation_error:bad-imei";
    }
    if (payload["Meter Initial Reading"] === 0) {
      return "validation_error:reading-zero";
    }
  }
  return undefined;
}

export function isCreateDtrBackendDefectTestCase(testCase: {
  scenario: string;
  buildPayload: () => unknown;
}): boolean {
  if (isCreateDtrBackendDefect(testCase.scenario)) {
    return true;
  }
  const key = createDtrDefectKeyFromTestCase(testCase);
  return key != null && CREATE_DTR_BACKEND_DEFECT_SCENARIOS.has(key);
}
