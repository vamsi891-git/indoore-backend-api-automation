import { z } from "zod";

export const DtrLoadRatingOptionItemSchema = z
  .object({
    id: z.number().int(),
    value: z.string(),
  })
  .passthrough();

export const DtrLoadRatingOptionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(DtrLoadRatingOptionItemSchema),
  }),
});

export type DtrLoadRatingOptionItem = z.infer<
  typeof DtrLoadRatingOptionItemSchema
>;
export type ParsedDtrLoadRatingOptionsResponse = z.infer<
  typeof DtrLoadRatingOptionsResponseSchema
>;
