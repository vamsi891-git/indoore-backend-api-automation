import { z } from "zod";

const emptyable = z.string();

/** Generic success envelope — tighten per-endpoint as live samples land. */
export const ModulesPermissionsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.unknown(),
    message: emptyable.optional(),
  })
  .strict();

export const ModulesPermissionsListSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(z.record(z.string(), z.unknown())).optional(),
        modules: z.array(z.record(z.string(), z.unknown())).optional(),
        roles: z.array(z.record(z.string(), z.unknown())).optional(),
        users: z.array(z.record(z.string(), z.unknown())).optional(),
        notifications: z.array(z.record(z.string(), z.unknown())).optional(),
        logs: z.array(z.record(z.string(), z.unknown())).optional(),
        rows: z.array(z.record(z.string(), z.unknown())).optional(),
        pagination: z
          .object({
            page: z.number().optional(),
            limit: z.number().optional(),
            total: z.number().optional(),
            totalPages: z.number().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();
