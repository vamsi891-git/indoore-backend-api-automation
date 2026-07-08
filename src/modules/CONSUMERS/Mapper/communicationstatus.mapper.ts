export type CommunicationStatusScenario =
  | "status_with_date"
  | "status_default_today"
  | "status_dd_mm_yyyy"
  | "status_by_meter"
  | "invalid_date"
  | "consumer_not_found"
  | "meter_not_found"
  | "empty_consumer_ref"
  | "contract_zero_intervals"
  | "contract_with_readings";

export interface CommunicationStatusErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export interface CommunicationIntervals {
  display: string;
  subtitle: string;
  receivedToday: number;
  expectedPerDay: number;
  /** Present only when percent > 0 */
  percent?: number;
  lastReadingToday?: string;
}

export interface CommunicationDelayed {
  display: string;
  subtitle: string;
  delaySeconds: number;
  lastSeen?: string;
  previousReading?: string;
}

export interface CommunicationStatusData {
  date: string;
  latestReadingDateTime?: string;
  intervals: CommunicationIntervals;
  delayed: CommunicationDelayed;
}

export interface CommunicationStatusResponse {
  success: boolean;
  data?: CommunicationStatusData | null;
}

export interface MappedCommunicationStatus {
  success: boolean;
  data: CommunicationStatusData | null;
  date: string | null;
  intervals: CommunicationIntervals | null;
  delayed: CommunicationDelayed | null;
  latestReadingDateTime: string | null;
}

export class CommunicationStatusMapper {
  static map(response: CommunicationStatusResponse): MappedCommunicationStatus {
    const data = response.data ?? null;
    return {
      success: response.success,
      data,
      date: data?.date ?? null,
      intervals: data?.intervals ?? null,
      delayed: data?.delayed ?? null,
      latestReadingDateTime: data?.latestReadingDateTime ?? null,
    };
  }
}
