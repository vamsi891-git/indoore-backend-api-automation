export interface DashboardOverall {
  totalMetersRequested: number;
  totalMetersReplaced: number;
  totalPendingMeters: number;
  totalUnmappedMeters: number;
}

export interface DashboardMyWork {
  completedToday: number;
  completedThisMonth: number;
  totalCompleted: number;
  latestCompletedDate: string | null;
}

export interface DashboardSummaryData {
  overall: DashboardOverall;
  myWork: DashboardMyWork;
}
export interface DashboardSummaryResponse {
  success: boolean;
  data: DashboardSummaryData;

}
export class DashboardSummaryMapper {
  static map(response: DashboardSummaryResponse,): DashboardSummaryData & { success: boolean } {
      const data = response.data ?? ({} as DashboardSummaryData);
      return {
          success: response.success,
          overall: {
              totalMetersRequested: data.overall?.totalMetersRequested ?? 0,
              totalMetersReplaced: data.overall?.totalMetersReplaced ?? 0,
              totalPendingMeters: data.overall?.totalPendingMeters ?? 0,
              totalUnmappedMeters: data.overall?.totalUnmappedMeters ?? 0,
          },
          myWork: {
              completedToday:data.myWork?.completedToday ?? 0,
              completedThisMonth:data.myWork?.completedThisMonth ?? 0,
              totalCompleted:data.myWork?.totalCompleted ?? 0,
              latestCompletedDate:data.myWork?.latestCompletedDate?.trim() ??
                  null,

          },

      };

  }

}