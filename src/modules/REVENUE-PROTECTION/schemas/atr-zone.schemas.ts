import { z } from "zod";
import { ColumnSchema, PaginationSchema } from "../../../core/schemas/api-response.schemas";

/** Backend returns Indian display dates (DD-MM-YYYY); empty allowed. */
export const P4_DATE_REGEX = /^(\d{2}-\d{2}-\d{4})?$/;

/** Human-readable timestamps like "26 Aug 2025, 4:45 pm" or "25 Sept 2025, 4:45 pm". */
export const ENTRY_DATE_TIME_REGEX =
  /^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec) \d{4}, \d{1,2}:\d{2} (am|pm)$/i;

export const AtrZoneRowSchema = z
  .object({
    id: z.string().min(1),
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
    eventCategory: z.string(),
    occurrenceTime: z
      .string()
      .refine((val) => val === "" || ENTRY_DATE_TIME_REGEX.test(val), {
        message: 'occurrenceTime must be empty or match "D MMM YYYY, h:mm am/pm"',
      }),
    restorationTime: z
      .string()
      .refine((val) => val === "" || ENTRY_DATE_TIME_REGEX.test(val), {
        message: "restorationTime must be empty or match the datetime format",
      }),
    remarks: z.string(),
    amountBilled: z.number(),
    amountRealised: z.number(),
    fieldRemarks: z.string(),
    p4Number: z.string(),
    p4Date: z.string().regex(P4_DATE_REGEX, {
      message: "p4Date must be DD-MM-YYYY or empty string",
    }),
    enteredByName: z.string(),
    entryDateTime: z
      .string()
      .refine((val) => val === "" || ENTRY_DATE_TIME_REGEX.test(val), {
        message: 'entryDateTime must be empty or match "D MMM YYYY, h:mm am/pm"',
      }),
    year: z.string(),
    month: z.string(),
  })
  .passthrough();

export const AtrZoneDataSchema = z
  .object({
    columns: z.array(ColumnSchema),
    rows: z.array(AtrZoneRowSchema),
    pagination: PaginationSchema,
  })
  .passthrough();

export const AtrZoneSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: AtrZoneDataSchema,
});

export type ParsedAtrZoneResponse = z.infer<typeof AtrZoneSuccessResponseSchema>;
