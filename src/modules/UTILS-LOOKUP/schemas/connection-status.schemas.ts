import { z } from "zod";

export const ConnectionStatusItemSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    shortName: z.string().nullable(),
  })
  .strict();

export const ConnectionStatusDataSchema = z
  .object({
    items: z.array(ConnectionStatusItemSchema),
  })
  .strict();

export const ConnectionStatusSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: ConnectionStatusDataSchema,
  })
  .strict();
