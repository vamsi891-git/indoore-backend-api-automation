import { z } from "zod";
import {ColumnSchema,PaginationSchema,} from "../../../core/schemas/api-response.schemas";
import { P4_DATE_REGEX, ENTRY_DATE_TIME_REGEX } from "./cases.schemas";

/**
 * occurrenceTime uses the same human-readable format as entryDateTime
 * ("28 Apr 2026, 12:00 am"), confirmed from the sample. restorationTime
 * appears empty in every sample row — treat as empty-or-same-format until
 * a populated example is seen. FLAG: confirm with backend whether
 * restorationTime is ever non-empty for this endpoint.
 */
export const AtrZoneRowSchema = z
  .object({
    id: z.string().min(1), // NOTE: not sourced from DB — see mapper comment
    circle: z.string(),
    division: z.string(),
    zone: z.string(),
    feeder: z.string(),
    dtr: z.string(),
    feeder1: z.string(),
    dtr1: z.string(),
    ivrs: z.string(),
    meterSerialNumber: z.string(),
    eventName: z.string(),
    eventCategory: z.string(), // observed always empty — see DQ notes
    occurrenceTime: z.string().regex(ENTRY_DATE_TIME_REGEX, {
      message: 'occurrenceTime must match "D MMM YYYY, h:mm am/pm"',
    }),
    restorationTime: z.string().refine(
      (val) => val === "" || ENTRY_DATE_TIME_REGEX.test(val),
      { message: "restorationTime must be empty or match the datetime format" },
    ),
    remarks: z.string(),
    amountBilled: z.number(),
    amountRealised: z.number(), // NOTE: spelled differently than Cases' amountRealisation
    fieldRemarks: z.string(),
    p4Number: z.string(),
    p4Date: z.string().regex(P4_DATE_REGEX, {
      message: "p4Date must be DD-MM-YYYY or empty string",
    }),
    entryDateTime: z.string().regex(ENTRY_DATE_TIME_REGEX, {
      message: 'entryDateTime must match "D MMM YYYY, h:mm am/pm"',
    }),
    year: z.string(),
    month: z.string(),
  })
  .strict();
export const AtrZoneDataSchema = z
  .object({
    columns: z.array(ColumnSchema),
    rows: z.array(AtrZoneRowSchema),
    pagination: PaginationSchema,
  })
  .strict();
export const AtrZoneSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: AtrZoneDataSchema,
  })
  .strict();
export type AtrZoneRow = z.infer<typeof AtrZoneRowSchema>;
export type AtrZoneData = z.infer<typeof AtrZoneDataSchema>;
export type ParsedAtrZoneResponse = z.infer<typeof AtrZoneSuccessResponseSchema>;