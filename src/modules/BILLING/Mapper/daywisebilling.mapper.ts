import {
    DaywiseBillingResponseSchema,
    isDaywiseGridPayload,
    type DaywiseBillingDataPayload,
    type ParsedDaywiseBillingResponse,
} from "../schemas/billing.schemas";

export interface DaywiseBillingResponse {
    success: boolean;
    data: DaywiseBillingData;

}
export interface DaywiseBillingData {
    month: number;
    year: number;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    totalExact: boolean;

    items: DaywiseBillingItem[];

}
export interface DaywiseBillingItem {
    slNo: number;
    division: string | null;
    zone: string | null;
    feeder: string | null;
    dtr: string | null;
    consumerName: string | null;
    consumerAddress: string | null;
    ivrsNumber: string | null;
    tariff: string | null;
    meterNumber: string;
    phase: string;
    mf: number | null;
    sanctionedLoadKw: number | null;

    d1Kwh: number | null;
    d2Kwh: number | null;
    d3Kwh: number | null;
    d4Kwh: number | null;
    d5Kwh: number | null;
    d6Kwh: number | null;
    d7Kwh: number | null;
    d8Kwh: number | null;
    d9Kwh: number | null;
    d10Kwh: number | null;
    d11Kwh: number | null;
    d12Kwh: number | null;
    d13Kwh: number | null;
    d14Kwh: number | null;
    d15Kwh: number | null;
    d16Kwh: number | null;
    d17Kwh: number | null;
    d18Kwh: number | null;
    d19Kwh: number | null;
    d20Kwh: number | null;
    d21Kwh: number | null;
    d22Kwh: number | null;
    d23Kwh: number | null;
    d24Kwh: number | null;
    d25Kwh: number | null;
    d26Kwh: number | null;
    d27Kwh: number | null;
    d28Kwh: number | null;
    d29Kwh: number | null;
    d30Kwh: number | null;
    d31Kwh: number | null;

}

export interface DaywiseBillingQuery {
    month: number;
    year: number;
    page: number;
    limit: number;
}

export class DaywiseBillingMapper {
    /** Validates API contract before business-rule validators run. */
    static parseResponse(body: unknown): ParsedDaywiseBillingResponse {
        return DaywiseBillingResponseSchema.parse(body);
    }

    /** Normalizes grid `{ rows, pagination }` or legacy flat `{ items, total }` shape. */
    static mapData(
        data: DaywiseBillingDataPayload,
        query: DaywiseBillingQuery,
    ): DaywiseBillingData {
        if (isDaywiseGridPayload(data)) {
            const { pagination, rows } = data;
            return {
                month: query.month,
                year: query.year,
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.totalPages,
                hasMore: pagination.page < pagination.totalPages,
                totalExact: true,
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