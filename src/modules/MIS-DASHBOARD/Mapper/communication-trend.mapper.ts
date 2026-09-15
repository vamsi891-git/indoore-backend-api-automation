export interface CommunicationTrendPoint {
  date: string;
  ipCount: number;
  dpCount: number;
  lsCount: number;
}

export interface CommunicationTrendData {
  fromDate: string;
  toDate: string;
  communicationTrend: CommunicationTrendPoint[];
}

export interface CommunicationTrendResponse {
  success: boolean;
  data: CommunicationTrendData;
}

export class CommunicationTrendMapper {
  static map(data: any): CommunicationTrendData {
    return {
      fromDate: data?.fromDate ?? "",
      toDate: data?.toDate ?? "",
      communicationTrend: data?.communicationTrend ?? [],
    };
  }
}
