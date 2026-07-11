export interface TechnicalSummaryReport {
    analysisType: string;
    reportName: string;
    category: string;
    totalCount: number;
    domesticCount: number;
    nonDomesticCount: number;
}
export interface TechnicalSummaryData {
    month: number;
    year: number;
    reports: TechnicalSummaryReport[];
}

export interface TechnicalSummaryResponse {
    success: boolean;
    data?: TechnicalSummaryData;
    error?: { code?: string; message?: string };
}

export class TechnicalSummaryMapper {
    static map(response: TechnicalSummaryResponse) {
        const data = response.data ?? ({} as TechnicalSummaryData);
        return {
            success: response.success,
            month: data.month ?? 1,
            year: data.year ?? new Date().getFullYear(),
            reports: data.reports ?? [],
        };
    }
}