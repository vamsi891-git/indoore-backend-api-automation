export interface BillingHistoryRow {
    periodLabel: string | null;
    consumptionKwh: number | null;
    billAmount: number | null;
    consumptionSummaryText: string;
    paymentStatus: string | null;
}

export interface BillingHistoryResponse {
    success: boolean;
    data: BillingHistoryRow[];
}

export class BillingHistoryMapper {
    static map(response: BillingHistoryResponse): {
        success: boolean;
        items: BillingHistoryRow[];
    } {
        return {
            success: response.success,
            items: Array.isArray(response.data) ? response.data : [],
        };
    }
}
