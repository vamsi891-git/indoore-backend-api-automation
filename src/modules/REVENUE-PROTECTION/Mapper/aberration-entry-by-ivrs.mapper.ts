export interface AberrationEntryByIvrsData {
  ivrsNo: string;
}

export interface AberrationEntryByIvrsResponse {
  success: boolean;
  data?: AberrationEntryByIvrsRawData;
  error?: { code?: string; message?: string; details?: unknown };
  message?: string;
}

export interface AberrationEntryByIvrsRawData {
  ivrsNo?: unknown;
}

/**
 * PATCH body for aberration-entry/:ivrsNo.
 * Field names match live VALIDATION_ERROR fieldErrors.
 */
export interface AberrationEntryUpdatePayload {
  remarks: string;
  amountBilled: number;
  amountRealised: number;
  mrTransactionNo: string;
  fieldOfficerRemarks: string;
  fieldOfficerName: string;
  fieldOfficerDesignation: string;
  /** Live API accepts either p4No or p4Number. */
  p4No?: string;
  p4Number?: string;
  p4Date?: string;
  inspectionDate?: string;
}

function toText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim();
}

export class AberrationEntryByIvrsMapper {
  static mapData(
    raw: AberrationEntryByIvrsRawData | undefined,
  ): AberrationEntryByIvrsData {
    return {
      ivrsNo: toText(raw?.ivrsNo),
    };
  }
}
