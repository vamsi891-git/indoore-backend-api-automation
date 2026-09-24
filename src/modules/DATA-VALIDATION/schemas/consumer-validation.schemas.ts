import { z } from "zod";
import { ApiErrorResponseSchema } from "../../../core/schemas/api-response.schemas";

const requiredString = z.string().min(1);
const columnSchema = z
  .object({
    key: requiredString,
    header: requiredString,
  })
  .strict();

export const ConsumerValidationRowSchema = z
  .object({
    id: requiredString,
    consumerId: z.string(),
    consumerName: z.string(),
    ivrsNumber: z.string(),
    accountId: z.string(),
    meterSerialNumber: z.string(),
    meterPhase: z.string(),
    category: z.string(),
    validationName: z.string(),
    validationRule: z.string(),
    validationStatus: z.string(),
    validationDate: z.string(),
  })
  .strict();

export const ConsumerValidationListDataSchema = z
  .object({
    columns: z.array(columnSchema),
    rows: z.array(ConsumerValidationRowSchema),
    pagination: z
      .object({
        page: z.number().int().positive(),
        limit: z.number().int().positive(),
        total: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const ConsumerValidationSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: ConsumerValidationListDataSchema,
  })
  .strict();

export { ApiErrorResponseSchema };
