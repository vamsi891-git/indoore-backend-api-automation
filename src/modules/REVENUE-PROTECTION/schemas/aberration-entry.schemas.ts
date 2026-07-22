import { z } from "zod";
import { P4_DATE_REGEX } from "./cases.schemas";
/**
 * Backend date formats observed from the API:
 *
 * 22 Jan 2026, 12:00 am
 * 10 Jul 2026, 1:38 pm
 *
 * Empty string is allowed for nullable date fields.
 */
export const ENTRY_DATE_TIME_REGEX =
  /^\d{1,2}\s[A-Za-z]{3}\s\d{4},\s\d{1,2}:\d{2}\s(am|pm)$/i;
export const MONTH_NAME_REGEX =
  /^(January|February|March|April|May|June|July|August|September|October|November|December)$/;
export const YEAR_REGEX = /^\d{4}$/;
export const ColumnSchema = z
  .object({
    key: z.string().min(1),
    header: z.string().min(1),
  })
  .strict();
export const PaginationSchema = z
  .object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
  .strict();

export const AberrationEntryRowSchema = z
  .object({
    id: z.string(),
    circle: z.string(),
    division: z.string(),
    zone: z.string(),
    subStation: z.string(),
    feeder: z.string(),
    dtr: z.string(),
    name: z.string(),
    address: z.string(),
    ivrsNo: z.string(),
    meterSerialNo: z.string(),
    eventName: z.string(),
    occurrenceTime: z.string().regex(ENTRY_DATE_TIME_REGEX),
    restorationTime: z.union([
      z.literal(""),
      z.string().regex(ENTRY_DATE_TIME_REGEX),
    ]),
    remarks: z.string(),
    amountBilled: z.number(),
    amountRealised: z.number(),
    fieldOfficerRemarks: z.string(),
    fieldOfficerName: z.string(),
    fieldOfficerDesignation: z.string(),
    mrTransactionNo: z.string(),
    p4No: z.string(),
    p4Date: z.string().regex(P4_DATE_REGEX, {
      message: "p4Date must be DD-MM-YYYY or empty string",
    }),
    inspectionDate: z.string().regex(P4_DATE_REGEX, {
      message: "inspectionDate must be DD-MM-YYYY or empty string",
    }),
    entryDate: z.string().regex(ENTRY_DATE_TIME_REGEX),
    month: z.string().regex(MONTH_NAME_REGEX),
    year: z.string().regex(YEAR_REGEX),
  })
  .strict();
export const AberrationEntryDataSchema = z
  .object({
    columns: z.array(ColumnSchema),
    rows: z.array(AberrationEntryRowSchema),
    pagination: PaginationSchema,
  })
  .strict();
export const AberrationEntrySuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: AberrationEntryDataSchema,
  })
  .strict();