export interface DisconnectionMonthRow {
  month: string;
  disconnected: number;
  connected: number;
}

export interface DisconnectionDetailsData {
  months: DisconnectionMonthRow[];
}

export interface DisconnectionDetailsResponse {
  success: boolean;
  data?: DisconnectionDetailsData;
  message?: string;
  error?: { code?: string; message?: string };
}

export class DisconnectionDetailsMapper {
  static map(
    response: DisconnectionDetailsResponse,
  ): DisconnectionDetailsData & { success: boolean } {
    const data = response.data ?? { months: [] };
    return {
      success: response.success,
      months: Array.isArray(data.months) ? data.months : [],
    };
  }
}
