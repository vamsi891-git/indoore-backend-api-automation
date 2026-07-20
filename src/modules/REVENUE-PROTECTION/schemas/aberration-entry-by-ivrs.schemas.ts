import { z } from "zod";

export const AberrationEntryByIvrsDataSchema = z
  .object({
    ivrsNo: z.string().min(1),
  })
  .strict();

export const AberrationEntryByIvrsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: AberrationEntryByIvrsDataSchema,
  })
  .strict();
