export interface TechnicalReportRow {
  meterLookupId: number;
  subDivision: string;
  subStation: string;
  feeder: string;
  dtr: string;
  name: string;
  address: string;
  ivrsNumber: string;
  category: string;
  msn: string;
  phase: string;
  durationInHours?: number;
  eventName: string;
}

export interface TechnicalReportResponse {
  success: boolean;

  data: {
      analysisType: string;
      reportName: string;
      condition: string;
      category: string;

      month: number;
      year: number;

      page: number;
      pageSize: number;

      totalCount: number;
      totalPages: number;

      rows: TechnicalReportRow[];
  };
}

export class TechnicalReportMapper {

  static map(
      response: TechnicalReportResponse
  ) {

      return {

          analysisType:
              response.data.analysisType,

          reportName:
              response.data.reportName,

          condition:
              response.data.condition,

          category:
              response.data.category,

          month:
              response.data.month,

          year:
              response.data.year,

          page:
              response.data.page,

          pageSize:
              response.data.pageSize,

          totalCount:
              response.data.totalCount,

          totalPages:
              response.data.totalPages,

          rows:
              response.data.rows
      };
  }
}