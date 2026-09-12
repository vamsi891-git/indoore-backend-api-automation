import {
    DaywiseBillingResponseSchema,
    isDaywiseGridPayload,
    type DaywiseBillingDataPayload,
    type DaywiseBillingItem,
    type ParsedDaywiseBillingResponse,
} from "../schemas/billing.schemas";

export type { DaywiseBillingItem };

export interface DaywiseBillingResponse {
    success: boolean;
    data: DaywiseBillingData;
}

export interface DaywiseBillingData {
    month: number;
    year: number;
    page: number;
    limit: number;
    total: number | null;
    totalPages: number | null;
    hasMore: boolean;
    totalExact: boolean;
    items: DaywiseBillingItem[];
}

export interface DaywiseBillingQuery {
    month: number;
    year: number;
    page: number;
    limit: number;
}

export class DaywiseBillingMapper {
    static parseResponse(body: unknown): ParsedDaywiseBillingResponse {
        return DaywiseBillingResponseSchema.parse(body);
    }

    static mapData(
        data: DaywiseBillingDataPayload,
        query: DaywiseBillingQuery,
    ): DaywiseBillingData {
        if (isDaywiseGridPayload(data)) {
            const { pagination, rows } = data;
            const totalPages = pagination.totalPages;
            const hasMore =
                pagination.hasMore ??
                (totalPages != null && pagination.page < totalPages);
            return {
                month: query.month,
                year: query.year,
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages,
                hasMore,
                totalExact: pagination.totalIsExact ?? false,
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
            hasMore: data.hasMore ?? false,
            totalExact: data.totalExact ?? false,
            items: data.items ?? [],
        };
    }
}
