import { z } from "zod";

/** Slim consumer search row — mirrors ConsumerItem (mutation-proof + future wiring). */
export const ConsumerSearchItemSchema = z
  .object({
    id: z.string().optional(),
    slNo: z.number().optional(),
    consumerName: z.string(),
    consumerCid: z.string(),
    consumerAddress: z.string(),
    ivrsNo: z.string(),
    existingIvrsNo: z.string(),
    meterSerialNumber: z.string(),
    consumerMobileNumber: z.string(),
  })
  .strict();

export const ConsumerSearchDataSchema = z
  .object({
    items: z.array(ConsumerSearchItemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

export const ConsumerSearchSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: ConsumerSearchDataSchema,
  })
  .strict();
