import { z } from "zod";

export const NetworkHierarchyItemSchema = z
  .object({
    id: z.number().int().positive(),
    code: z.string().min(1),
    name: z.string().min(1),
    order: z.number().int().positive(),
  })
  .strict();

export const NetworkHierarchyDataSchema = z
  .object({
    items: z.array(NetworkHierarchyItemSchema),
  })
  .strict();

export const NetworkHierarchySuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: NetworkHierarchyDataSchema,
  })
  .strict();
