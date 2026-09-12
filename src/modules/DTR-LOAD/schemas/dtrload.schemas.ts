import { z } from "zod";

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();

export const DtrLoadColumnSchema = z.object({
  key: z.string(),
  header: z.string(),
});

export const DtrLoadPaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative().nullable(),
  totalPages: z.number().int().nonnegative().nullable(),
  hasMore: z.boolean().optional(),
  totalIsExact: z.boolean().optional(),
});

const hourFields = {
  H1: nullableNumber.optional(),
  H2: nullableNumber.optional(),
  H3: nullableNumber.optional(),
  H4: nullableNumber.optional(),
  H5: nullableNumber.optional(),
  H6: nullableNumber.optional(),
  H7: nullableNumber.optional(),
  H8: nullableNumber.optional(),
  H9: nullableNumber.optional(),
  H10: nullableNumber.optional(),
  H11: nullableNumber.optional(),
  H12: nullableNumber.optional(),
  H13: nullableNumber.optional(),
  H14: nullableNumber.optional(),
  H15: nullableNumber.optional(),
  H16: nullableNumber.optional(),
  H17: nullableNumber.optional(),
  H18: nullableNumber.optional(),
  H19: nullableNumber.optional(),
  H20: nullableNumber.optional(),
  H21: nullableNumber.optional(),
  H22: nullableNumber.optional(),
  H23: nullableNumber.optional(),
  H24: nullableNumber.optional(),
};

export const DtrLoadRowSchema = z
  .object({
    id: z.string().optional(),
    circle: nullableString.optional(),
    division: nullableString.optional(),
    zone: nullableString.optional(),
    subStation: nullableString.optional(),
    feeder: nullableString.optional(),
    dtrName: nullableString.optional(),
    dtrType: nullableString.optional(),
    dtrRating: nullableNumber.optional(),
    dtrRatingKva: nullableNumber.optional(),
    meterSerialNumber: nullableString.optional(),
    msn: nullableString.optional(),
    mf: nullableNumber.optional(),
    meterLookupId: z.number().int().nullable().optional(),
    totalHourlyKva: nullableNumber.optional(),
    avgKva: nullableNumber.optional(),
    logDate: nullableString.optional(),
    totalKwh: nullableNumber.optional(),
    hourlyValuesUnit: nullableString.optional(),
    loadingKva: nullableNumber.optional(),
    loadPercent: nullableNumber.optional(),
    loadVariation: nullableNumber.optional(),
    IR: nullableNumber.optional(),
    IY: nullableNumber.optional(),
    IB: nullableNumber.optional(),
    kWh: nullableNumber.optional(),
    avgLoadKva: nullableNumber.optional(),
    maxLoadKva: nullableNumber.optional(),
    maxLoadPercent: nullableNumber.optional(),
    minLoadKva: nullableNumber.optional(),
    ...hourFields,
  })
  .passthrough();

export const DtrLoadResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    columns: z.array(DtrLoadColumnSchema),
    rows: z.array(DtrLoadRowSchema),
    pagination: DtrLoadPaginationSchema,
  }),
});

export type DtrLoadRow = z.infer<typeof DtrLoadRowSchema>;
export type ParsedDtrLoadResponse = z.infer<typeof DtrLoadResponseSchema>;
