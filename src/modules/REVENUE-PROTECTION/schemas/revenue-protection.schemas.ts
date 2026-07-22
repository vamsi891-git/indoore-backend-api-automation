import { z } from "zod";
import {ColumnSchema,PaginationSchema,} from "../../../core/schemas/api-response.schemas";
const NumberLike = z.union([z.number(), z.string()]).transform((value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
});
export const AberrationSummaryRowSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    circle: z.string(),
    month: z.string(),
    year: z.union([z.string(), z.number()]),
    noOfCases: NumberLike,
    totalCasesAttended: NumberLike,
    pending: NumberLike,
    amountBilled: NumberLike,
    amountRealisation: NumberLike,
  })
  .passthrough();

export const AberrationsDataSchema = z
  .object({
    columns: z.array(ColumnSchema),
    rows: z.array(AberrationSummaryRowSchema),
    pagination: PaginationSchema,
  })
  .passthrough();
export const AberrationsSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: AberrationsDataSchema,
});
export type ParsedAberrationsResponse = z.infer<
  typeof AberrationsSuccessResponseSchema
>;
