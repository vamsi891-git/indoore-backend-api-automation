import {
    BillingDataResponseSchema,
    isBillingGridPayload,
    type BillingDataPayload,
    type BillingItem,
    type ParsedBillingDataResponse,
} from "../schemas/billing.schemas";

export type { BillingItem };

export interface BillingDataResponse {
    success: boolean;
    data: BillingData;
}

export interface BillingData {
    month: number;
    year: number;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    items: BillingItem[];
}

export interface BillingDataQuery {
    month: number;
    year: number;
    page: number;
    limit: number;
}

export class BillingDataMapper {
    /** Validates API contract before business-rule validators run. */
    static parseResponse(body: unknown): ParsedBillingDataResponse {
        return BillingDataResponseSchema.parse(body);
    }

    /** Normalizes grid `{ rows, pagination }` or legacy flat `{ items, total }` shape. */
    static mapData(data: BillingDataPayload, query: BillingDataQuery): BillingData {
        if (isBillingGridPayload(data)) {
            const { pagination, rows } = data;
            return {
                month: query.month,
                year: query.year,
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.totalPages,
                items: rows,
            };
        }

        return {
            month: data.month ?? query.month,
            year: data.year ?? query.year,
            page: data.page ?? query.page,
            limit: data.limit ?? query.limit,
            total: data.total ?? 0,
            totalPages: data.totalPages ?? 0,
            items: data.items ?? [],
        };
    }
}
