export interface CommunicationOverviewItem {
  label: string;
  count: number;
  percentage: string;
}

export interface CommunicationOverviewOverall {
  total: number;
  communicating: {
    count: number;
    percentage: string;
  };
  nonCommunicating: {
    count: number;
    percentage: string;
  };
}

export interface CommunicationOverviewData {
  fromDate: string;
  toDate: string;
  overall: CommunicationOverviewOverall;
  phases: CommunicationOverviewItem[];
}

export interface CommunicationOverviewResponse {
  success: boolean;
  data: CommunicationOverviewData;
}

export class CommunicationOverviewMapper {
  static map(data: any): CommunicationOverviewData {
    return {
      fromDate: data?.fromDate ?? "",
      toDate: data?.toDate ?? "",
      overall: data?.overall ?? {
        total: 0,
        communicating: { count: 0, percentage: "0.00" },
        nonCommunicating: { count: 0, percentage: "0.00" },
      },
      phases: data?.phases ?? [],
    };
  }
}
