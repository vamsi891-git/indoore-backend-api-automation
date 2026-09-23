import ExcelJS from "exceljs";
import { ZONE_WISE_ATR_XLSX_MIME } from "../Data/zone-wise-atr-events.data";

export interface ZoneWiseAtrUploadRow {
  ivrsNumber: string;
  eventName: string;
  occurrenceTime: string;
  remark: string;
}

/** Build a one-row ATR Cases upload workbook (same columns as UI template). */
export async function buildZoneWiseAtrEventsUploadBuffer(
  row: ZoneWiseAtrUploadRow,
): Promise<{ fileName: string; mimeType: string; buffer: Buffer }> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("ATR Events");
  sheet.getRow(1).values = [undefined, "IVRS Number", "Event_Name", "Occurrence_time", "Remark"];
  sheet.getCell("A2").value = row.ivrsNumber;
  sheet.getCell("B2").value = row.eventName;
  sheet.getCell("C2").value = row.occurrenceTime;
  sheet.getCell("D2").value = row.remark;
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return {
    fileName: `Upload_ATR_Cases_${row.ivrsNumber}.xlsx`,
    mimeType: ZONE_WISE_ATR_XLSX_MIME,
    buffer: Buffer.from(arrayBuffer),
  };
}
