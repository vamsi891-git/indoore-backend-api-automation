import { z } from "zod";

const NullableString = z.string().nullable();

export const DtrSearchItemSchema = z
  .object({
    slNo: z.number(),
    circle: NullableString,
    division: NullableString,
    zone: NullableString,
    subStation: NullableString,
    feeder: NullableString,
    code: z.string(),
    dtrCode: z.string(),
    dtrName: z.string(),
    dtr: z.string(),
    meterSerialNumber: NullableString,
    mf: NullableString,
    latitude: NullableString,
    longitude: NullableString,
    serviceDate: NullableString,
  })
  .strict();

/** Mapped DTR search page — array field is `item` (singular). */
export const DtrSearchDataSchema = z
  .object({
    item: z.array(DtrSearchItemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

export const DtrSearchSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: DtrSearchDataSchema,
  })
  .strict();
