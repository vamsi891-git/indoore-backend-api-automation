import ExcelJS from "exceljs";

/**
 * Read first-row headers from an ATR Summary .xlsx export.
 * ExcelJS row.values is 1-indexed (index 0 unused).
 */
export async function readAtrSummaryExportHeaders(
  buffer: Buffer | ArrayBuffer | Uint8Array,
): Promise<string[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return [];
  }
  const values = sheet.getRow(1).values;
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .slice(1)
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0);
}

/** Export files prepend "S.No"; strip it before comparing to list API headers. */
export function normalizeAtrSummaryExportHeaders(headers: string[]): string[] {
  if (headers[0]?.toLowerCase() === "s.no") {
    return headers.slice(1);
  }
  return headers;
}
