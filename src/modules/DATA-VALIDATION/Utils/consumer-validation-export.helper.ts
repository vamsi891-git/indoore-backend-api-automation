import ExcelJS from "exceljs";
import {
  CONSUMER_VALIDATION_EXPORT_DATA_START_ROW,
  CONSUMER_VALIDATION_EXPORT_HEADER_ROW,
  EXPECTED_CONSUMER_VALIDATION_COLUMNS,
} from "../Data/consumer-validation.data";

export type ConsumerValidationExportColumnKey =
  (typeof EXPECTED_CONSUMER_VALIDATION_COLUMNS)[number]["key"];

export type ConsumerValidationExportRow = Record<ConsumerValidationExportColumnKey, string>;

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object" && "text" in value && typeof value.text === "string") {
    return value.text.trim();
  }
  if (typeof value === "object" && "result" in value) {
    return cellText(value.result as ExcelJS.CellValue);
  }
  return String(value).trim();
}

function rowValues(sheet: ExcelJS.Worksheet, rowNumber: number): string[] {
  const values = sheet.getRow(rowNumber).values;
  if (!Array.isArray(values)) return [];
  return values.slice(1).map((value) => cellText(value as ExcelJS.CellValue));
}

export async function parseConsumerValidationExport(
  buffer: Buffer | ArrayBuffer | Uint8Array,
): Promise<{ headers: string[]; rows: ConsumerValidationExportRow[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { headers: [], rows: [] };
  }

  const headers = rowValues(sheet, CONSUMER_VALIDATION_EXPORT_HEADER_ROW).filter(
    (header) => header.length > 0,
  );

  const keyByHeader = new Map<string, ConsumerValidationExportColumnKey>(
    EXPECTED_CONSUMER_VALIDATION_COLUMNS.map((column) => [column.header, column.key]),
  );

  const rows: ConsumerValidationExportRow[] = [];
  for (
    let rowNumber = CONSUMER_VALIDATION_EXPORT_DATA_START_ROW;
    rowNumber <= sheet.rowCount;
    rowNumber++
  ) {
    const values = rowValues(sheet, rowNumber);
    if (values.every((value) => value.length === 0)) {
      continue;
    }
    const row = {} as ConsumerValidationExportRow;
    for (const column of EXPECTED_CONSUMER_VALIDATION_COLUMNS) {
      row[column.key] = "";
    }
    headers.forEach((header, index) => {
      const key = keyByHeader.get(header);
      if (!key) return;
      row[key] = values[index] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}
