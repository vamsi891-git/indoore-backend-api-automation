import { z } from "zod";

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const ColumnSchema = z.object({
  key: z.string(),
  header: z.string(),
});

export type ParsedApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ParsedPagination = z.infer<typeof PaginationSchema>;
