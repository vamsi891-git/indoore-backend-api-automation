import { z } from "zod";

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();

/**
 * Live billing-data returns some metrics as decimal strings ("1.8420") or numbers.
 * Accept either; normalizeBillingItem coerces to number|null for validators.
 */
const nullableStringOrNumber = z
  .union([z.number(), z.string()])
  .nullable();

export const PaginationSchema = z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    /** Null when `includeTotal=false` on some billing APIs. Daywise still sends an estimate. */
    total: z.number().int().nonnegative().nullable(),
    totalPages: z.number().int().nonnegative().nullable(),
    hasMore: z.boolean().optional(),
    totalIsExact: z.boolean().optional(),
});

export const ColumnSchema = z.object({
    key: z.string(),
    header: z.string(),
});

export const BillingItemSchema = z
    .object({
        id: z.string().optional(),
        slNo: z.number(),
        circle: nullableString,
        division: nullableString,
        zone: nullableString,
        substation: nullableString,
        feeder: nullableString,
        dtr: nullableString,
        sanctionedLoadKw: nullableStringOrNumber,
        consumerName: nullableString,
        consumerAddress: nullableString,
        ivrsNumber: nullableString,
        tariff: nullableString,
        meterNumber: z.string().min(1),
        phase: z.string().min(1),
        mf: nullableNumber,
        billingDate: z.string().min(1).optional(),
        /** Live grid API — billing period timestamp (replaces legacy billingDate). */
        meterTimestamp: z.string().min(1).optional(),
        serviceDate: nullableString,
        entryDateTime: z.string().min(1).optional(),
        pf: nullableNumber,
        kwhC: nullableNumber,
        kwhT1: nullableNumber,
        kwhT2: nullableNumber,
        kwhT3: nullableNumber,
        kwhT4: nullableNumber,
        kwhT5: nullableNumber,
        kwhT6: nullableNumber,
        kwhT7: nullableNumber,
        kwhT8: nullableNumber,
        kvahC: nullableNumber,
        kvahT1: nullableNumber,
        kvahT2: nullableNumber,
        kvahT3: nullableNumber,
        kvahT4: nullableNumber,
        kvahT5: nullableNumber,
        kvahT6: nullableNumber,
        kvahT7: nullableNumber,
        kvahT8: nullableNumber,
        mdKw: nullableStringOrNumber,
        mdKwOt: z.string().nullable().optional(),
        mdKva: nullableStringOrNumber,
        mdKvaOt: z.string().nullable().optional(),
        billOnMin: nullableNumber,
        kwhExpC: nullableNumber,
        kvahExpC: nullableNumber,
        meterMake: nullableString.optional(),
        meterLookupTblRefId: z.number().int().nullable().optional(),
        hesTimestamp: nullableString.optional(),
        rank: z.number().int().nullable().optional(),
    })
    .passthrough();

/** Live API: { columns, rows, pagination, billingClass?, mappingProfile? } */
export const BillingDataGridSchema = z.object({
    columns: z.array(ColumnSchema).optional(),
    rows: z.array(BillingItemSchema),
    pagination: PaginationSchema,
    billingClass: z.string().optional(),
    mappingProfile: z.string().optional(),
});

/** Legacy flat pagination (older contract) */
export const BillingDataFlatSchema = z.object({
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    items: z.array(BillingItemSchema),
});

export const BillingDataSchema = z.union([
    BillingDataGridSchema,
    BillingDataFlatSchema,
]);

export const BillingDataResponseSchema = z.object({
    success: z.literal(true),
    data: BillingDataSchema,
});

const dailyKwhField = z.number().nullable();

export const DaywiseBillingItemSchema = z
    .object({
        id: z.string().optional(),
        slNo: z.number(),
        meterLookupId: z.number().int().nullable().optional(),
        division: nullableString,
        zone: nullableString,
        feeder: nullableString,
        dtr: nullableString,
        consumerName: nullableString,
        consumerAddress: nullableString,
        ivrsNumber: nullableString,
        tariff: nullableString,
        meterNumber: z.string().min(1),
        phase: z.string().min(1),
        mf: nullableNumber,
        sanctionedLoadKw: nullableNumber,
        d1Kwh: dailyKwhField,
        d2Kwh: dailyKwhField,
        d3Kwh: dailyKwhField,
        d4Kwh: dailyKwhField,
        d5Kwh: dailyKwhField,
        d6Kwh: dailyKwhField,
        d7Kwh: dailyKwhField,
        d8Kwh: dailyKwhField,
        d9Kwh: dailyKwhField,
        d10Kwh: dailyKwhField,
        d11Kwh: dailyKwhField,
        d12Kwh: dailyKwhField,
        d13Kwh: dailyKwhField,
        d14Kwh: dailyKwhField,
        d15Kwh: dailyKwhField,
        d16Kwh: dailyKwhField,
        d17Kwh: dailyKwhField,
        d18Kwh: dailyKwhField,
        d19Kwh: dailyKwhField,
        d20Kwh: dailyKwhField,
        d21Kwh: dailyKwhField,
        d22Kwh: dailyKwhField,
        d23Kwh: dailyKwhField,
        d24Kwh: dailyKwhField,
        d25Kwh: dailyKwhField,
        d26Kwh: dailyKwhField,
        d27Kwh: dailyKwhField,
        d28Kwh: dailyKwhField,
        d29Kwh: dailyKwhField,
        d30Kwh: dailyKwhField,
        d31Kwh: dailyKwhField,
    })
    .passthrough();

export const DaywiseBillingDataGridSchema = z.object({
    columns: z.array(ColumnSchema).optional(),
    rows: z.array(DaywiseBillingItemSchema),
    pagination: PaginationSchema,
});

export const DaywiseBillingDataFlatSchema = z.object({
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasMore: z.boolean().optional(),
    totalExact: z.boolean().optional(),
    items: z.array(DaywiseBillingItemSchema),
});

export const DaywiseBillingDataSchema = z.union([
    DaywiseBillingDataGridSchema,
    DaywiseBillingDataFlatSchema,
]);

export const DaywiseBillingResponseSchema = z.object({
    success: z.literal(true),
    data: DaywiseBillingDataSchema,
});

export type BillingItem = z.infer<typeof BillingItemSchema>;
export type DaywiseBillingItem = z.infer<typeof DaywiseBillingItemSchema>;
export type ParsedBillingDataResponse = z.infer<typeof BillingDataResponseSchema>;
export type ParsedDaywiseBillingResponse = z.infer<typeof DaywiseBillingResponseSchema>;
export type BillingDataPayload = z.infer<typeof BillingDataSchema>;
export type DaywiseBillingDataPayload = z.infer<typeof DaywiseBillingDataSchema>;

export function isBillingGridPayload(
    data: BillingDataPayload,
): data is z.infer<typeof BillingDataGridSchema> {
    return "pagination" in data && "rows" in data;
}

export function isDaywiseGridPayload(
    data: DaywiseBillingDataPayload,
): data is z.infer<typeof DaywiseBillingDataGridSchema> {
    return "pagination" in data && "rows" in data;
}
