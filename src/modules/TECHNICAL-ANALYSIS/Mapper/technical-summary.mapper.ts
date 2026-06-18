export interface TechnicalSummaryReport {
    analysisType: string;
    reportName: string;
    category: string;
    totalCount: number;
    domesticCount: number;
    nonDomesticCount: number;
}
export interface TechnicalSummaryResponse {
    success: boolean;
    data: {
        month: number;
        year: number;
        reports: TechnicalSummaryReport[];
    };
}
export class TechnicalSummaryMapper {
    static map(response: TechnicalSummaryResponse) {
        return {
            month:response.data.month,
            year:response.data.year,
            reports:response.data.reports
        };
    }
}