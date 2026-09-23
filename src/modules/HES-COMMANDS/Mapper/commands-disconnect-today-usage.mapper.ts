export interface DisconnectTodayUsageData {
  date: string;
  timezone: string;
  limit: number;
  used: number;
  remaining: number;
  disconnectedMeters: number;
  successfulDisconnectAttempts: number;
  uniqueDisconnectMeters: number;
}

export interface DisconnectTodayUsageResponse {
  success: boolean;
  data?: DisconnectTodayUsageData;
  message?: string;
  error?: { code?: string; message?: string };
}

export interface MappedDisconnectTodayUsageData {
  date: string;
  timezone: string;
  limit: number;
  used: number;
  remaining: number;
  disconnectedMeters: number;
  successfulDisconnectAttempts: number;
  uniqueDisconnectMeters: number;
}

export class CommandsDisconnectTodayUsageMapper {
  static mapResponse(body: DisconnectTodayUsageResponse): MappedDisconnectTodayUsageData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful disconnect today-usage response");
    }

    const { data } = body;
    return {
      date: String(data.date ?? "").trim(),
      timezone: String(data.timezone ?? "").trim(),
      limit: Number(data.limit),
      used: Number(data.used),
      remaining: Number(data.remaining),
      disconnectedMeters: Number(data.disconnectedMeters),
      successfulDisconnectAttempts: Number(data.successfulDisconnectAttempts),
      uniqueDisconnectMeters: Number(data.uniqueDisconnectMeters),
    };
  }
}
