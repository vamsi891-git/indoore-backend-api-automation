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

const EM_DASH = "—";

/** Mirrors backend `formatConsumptionSummary` empty-state handling. */
function normalizeConsumptionSummary(
    kwh: number | null,
    summary: string,
): string {
    if (kwh == null || !Number.isFinite(kwh)) {
        return summary === EM_DASH ? "" : summary;
    }
    return summary;
}

export class BillingHistoryMapper {
    static map(response: BillingHistoryResponse): {
        success: boolean;
        items: BillingHistoryRow[];
    } {
        const items = Array.isArray(response.data)
            ? response.data.map((row) => ({
                  ...row,
                  consumptionSummaryText: normalizeConsumptionSummary(
                      row.consumptionKwh,
                      row.consumptionSummaryText,
                  ),
              }))
            : [];

        return {
            success: response.success,
            items,
        };
    }
}
