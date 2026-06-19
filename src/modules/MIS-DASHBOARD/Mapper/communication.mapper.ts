export interface CommunicationTrend {
  date: string;
  ipCount: number;
  dpCount: number;
  lsCount: number;
}

export interface CommunicationItem {
  label: string;
  count: number;
  percentage: string;
}

export interface Overall {
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

export interface CommStatsData {
  fromDate: string;
  toDate: string;
  overall: Overall;
  categories: CommunicationItem[];
  phases: CommunicationItem[];
  communicationTrend:
  CommunicationTrend[];
}
export interface CommStatsResponse {
  success: boolean;
  data: CommStatsData;
}

export class CommStatsMapper { static mapCommStats(data: any): CommStatsData {
    return {
      fromDate:data?.fromDate ?? "",
      toDate:data?.toDate ?? "",
      overall:data?.overall ?? {
          total: 0,
          communicating: {
            count: 0,
            percentage: "0.00"
          },
          nonCommunicating: {
            count: 0,
            percentage: "0.00"
          }
        },
      categories:data?.categories ?? [],
      phases:data?.phases ?? [],
      communicationTrend:data?.communicationTrend ?? []
    };

  }

}