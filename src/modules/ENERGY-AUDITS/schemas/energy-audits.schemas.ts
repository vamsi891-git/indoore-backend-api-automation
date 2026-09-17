import { z } from "zod";
import {
  ColumnSchema,
  PaginationSchema,
} from "../../../core/schemas/api-response.schemas";
import { HOURLY_BUCKET_KEYS } from "../Mapper/hourly-loss-report.mapper";

const emptyable = z.string();
const nullableString = z.string().nullable();
const mfValue = z.union([z.string(), z.number()]).nullable().optional();

export const EnergyAuditsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.unknown(),
    message: emptyable.optional(),
  })
  .strict();

export const EnergyAuditsListSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(z.record(z.string(), z.unknown())).optional(),
        rows: z.array(z.record(z.string(), z.unknown())).optional(),
        pagination: PaginationSchema.partial().passthrough().optional(),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

export const LossAnalysisRowSchema = z
  .object({
    id: z.string().min(1),
    slNo: z.number().optional(),
    circle: nullableString.optional(),
    division: nullableString.optional(),
    zone: z.string().trim().min(1),
    feeder: z.string().trim().min(1),
    dtrCode: z.string().optional(),
    dtrRating: z.union([z.string(), z.number()]).nullable().optional(),
    dtrName: z.string().trim().min(1),
    mf: mfValue,
    meterSerialNumber: z.string().trim().min(1),
    inputUnits: z.number(),
    consumerCount: z.number(),
    totalSoldUnits: z.number(),
    lossKwh: z.number(),
    billingEfficiencyPct: z.number(),
    lossPct: z.number(),
  })
  .passthrough();

export const LossAnalysisSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        columns: z.array(ColumnSchema),
        rows: z.array(LossAnalysisRowSchema),
        pagination: PaginationSchema,
      })
      .strict(),
  })
  .strict();

const hourlyBuckets = Object.fromEntries(
  HOURLY_BUCKET_KEYS.map((key) => [key, z.number().optional()]),
) as Record<(typeof HOURLY_BUCKET_KEYS)[number], z.ZodOptional<z.ZodNumber>>;

export const HourlyLossReportRowSchema = z
  .object({
    id: z.string().optional(),
    rowKind: z.string().trim().min(1),
    circle: nullableString.optional(),
    division: nullableString.optional(),
    zone: nullableString.optional(),
    substation: nullableString.optional(),
    feeder: nullableString.optional(),
    dtrName: nullableString.optional(),
    dtrMeterSerialNumber: nullableString.optional(),
    consumerName: nullableString.optional(),
    meterSerialNumber: nullableString.optional(),
    mf: mfValue,
    total: z.number(),
    ...hourlyBuckets,
  })
  .passthrough();

export const HourlyLossReportSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        columns: z.array(ColumnSchema),
        rows: z.array(HourlyLossReportRowSchema),
        pagination: PaginationSchema,
      })
      .strict(),
  })
  .strict();

const HourBucketSchema = z
  .object({
    hour: z.string().trim().min(1),
    time: z.string().trim().min(1),
    lossPct: z.number(),
  })
  .passthrough();

export const LossAnalysisStatsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        networkLookupId: z.number(),
        fromDate: z.string().trim().min(1),
        toDate: z.string().trim().min(1),
        totalEnergyInput: z.number(),
        totalConsumption: z.number(),
        totalLoss: z.number(),
        peakLossHour: HourBucketSchema,
        lowestLossHour: HourBucketSchema,
      })
      .strict(),
  })
  .strict();

export const LossAnalysisTrendsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        networkLookupId: z.number(),
        date: z.string().trim().min(1),
        items: z.array(HourBucketSchema),
      })
      .strict(),
  })
  .strict();

const NetworkTrendMonthlyItemSchema = z
  .object({
    date: z.null(),
    month: z.number(),
    year: z.number(),
    periodLabel: z.string().trim().min(1),
    lossPct: z.number(),
  })
  .passthrough();

const NetworkTrendDailyItemSchema = z
  .object({
    date: z.string().trim().min(1),
    month: z.null(),
    year: z.null(),
    periodLabel: z.string().trim().min(1),
    lossPct: z.number(),
  })
  .passthrough();

export const NetworkTrendsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.discriminatedUnion("reportType", [
      z
        .object({
          reportType: z.literal("billing"),
          anchorDate: z.null(),
          anchorMonth: z.number(),
          anchorYear: z.number(),
          items: z.array(NetworkTrendMonthlyItemSchema),
        })
        .strict(),
      z
        .object({
          reportType: z.literal("dp"),
          anchorDate: z.string().trim().min(1),
          anchorMonth: z.null().optional(),
          anchorYear: z.null().optional(),
          items: z.array(NetworkTrendDailyItemSchema),
        })
        .strict(),
      z
        .object({
          reportType: z.literal("ls"),
          anchorDate: z.string().trim().min(1),
          anchorMonth: z.null().optional(),
          anchorYear: z.null().optional(),
          items: z.array(HourBucketSchema),
        })
        .strict(),
    ]),
  })
  .strict();
