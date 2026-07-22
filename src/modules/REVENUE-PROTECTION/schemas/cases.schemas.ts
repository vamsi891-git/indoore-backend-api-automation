import { z } from "zod";
import {ColumnSchema,PaginationSchema,
} from "../../../core/schemas/api-response.schemas";
/**
 * Backend returns Indian display dates (DD-MM-YYYY), not ISO 8601.
 * Empty string is allowed when no P4 has been raised yet.
 */
export const P4_DATE_REGEX = /^(\d{2}-\d{2}-\d{4})?$/;
/**
 * Backend returns human-readable entry timestamps like "10 Jul 2026, 1:38 pm".
 * Do not treat these as ISO dates.
 */
export const ENTRY_DATE_TIME_REGEX =
  /^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}, \d{1,2}:\d{2} (am|pm)$/i;
/**
 * Confirm complete value set with backend — sample only shows Open / Resolved / Closed.
 */
export const CaseStatusSchema = z.enum(["Open", "Resolved", "Closed"]);
export const CaseRowSchema = z
  .object({
    id: z.string().min(1),
    circle: z.string(),
    division: z.string(),
    zone: z.string(),
    year: z.string(),
    month: z.string(),
    consumerName: z.string(),
    address: z.string(),
    msn: z.string(),
    category: z.string(),
    phase: z.string(),
    ivrsNo: z.string(),
    remarks: z.string(),
    event: z.string(),
    amountBilled: z.number(),
    amountRealisation: z.number(),
    p4Number: z.string(),
    p4Date: z.string().regex(P4_DATE_REGEX, {
      message: "p4Date must be DD-MM-YYYY or empty string (not ISO 8601)",
    }),
    entryDateTime: z.string().regex(ENTRY_DATE_TIME_REGEX, {
      message:
        'entryDateTime must match "D MMM YYYY, h:mm am/pm" (not ISO 8601)',
    }),
    status: CaseStatusSchema,
  })
  .strict();
export const CasesDataSchema = z
  .object({
    columns: z.array(ColumnSchema),
    rows: z.array(CaseRowSchema),
    pagination: PaginationSchema,
  })
  .strict();
export const CasesSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: CasesDataSchema,
  })
  .strict();
export type CaseStatus = z.infer<typeof CaseStatusSchema>;
export type CaseRow = z.infer<typeof CaseRowSchema>;
export type CasesData = z.infer<typeof CasesDataSchema>;
export type ParsedCasesResponse = z.infer<typeof CasesSuccessResponseSchema>;
