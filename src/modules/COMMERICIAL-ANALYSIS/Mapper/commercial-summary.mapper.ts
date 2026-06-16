export interface CommercialSummaryReport {
    analysisType: string;
    reportName: string;
    category: string;
    totalCount: number;
    domesticCount: number;
    nonDomesticCount: number;
}

export interface CommercialSummaryData {
    month: number;
    year: number;
    reports: CommercialSummaryReport[];
}

export interface CommercialSummaryResponse {
    success: boolean;
    data?: CommercialSummaryData;
    error?: { code?: string; message?: string };
}

export class CommercialSummaryMapper {
    static map(
        response: CommercialSummaryResponse,
    ): CommercialSummaryData & { success: boolean } {
        const data = response.data ?? ({} as CommercialSummaryData);
        return {
            success: response.success,
            month: data.month ?? 1,
            year: data.year ?? new Date().getFullYear(),
            reports: data.reports ?? [],
        };
    }
}
