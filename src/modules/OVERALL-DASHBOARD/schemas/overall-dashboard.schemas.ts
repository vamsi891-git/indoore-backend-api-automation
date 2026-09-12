import { z } from "zod";

const emptyable = z.string();
const periodSchema = z.enum(["hourly", "daily", "weekly", "monthly", "yearly"]);

const kpiCardSchema = z
  .object({
    value: emptyable,
    footer: emptyable.optional(),
    footerDelta: z.union([z.number(), z.string()]),
    sparklineData: z.array(z.union([z.number(), z.string()])),
  })
  .passthrough();

const labeledValueSchema = z
  .object({
    label: emptyable,
    value: z.union([z.number(), z.string()]),
    percent: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

const chartSeriesSchema = z
  .object({
    name: emptyable,
    data: z.array(z.union([z.number(), z.string()])),
  })
  .passthrough();

const chartSchema = z
  .object({
    categories: z.array(emptyable),
    series: z.array(chartSeriesSchema),
  })
  .passthrough();

export const OverallDashboardMetricsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        billingAvailability: kpiCardSchema,
        billingEfficiency: kpiCardSchema,
        revenueGainedRpu: kpiCardSchema,
        totalImprovement: kpiCardSchema,
        avgImprovement: kpiCardSchema,
        subsidySave: kpiCardSchema,
        incentivePf: kpiCardSchema,
        penaltyPf: kpiCardSchema,
        expectedRoi: kpiCardSchema,
        loadEnhanced: kpiCardSchema,
        installationSummary: z.array(labeledValueSchema),
        lineChartData: chartSchema.optional(),
        disconnectionData: chartSchema.optional(),
        disconnectionSummary: chartSchema.optional(),
        billingEfficiencyChart: chartSchema.optional(),
        billingEfficiencyDonut: z.array(labeledValueSchema).optional(),
        benefitsAtrCasesDonut: z.array(labeledValueSchema).optional(),
        atrAmountChart: chartSchema.optional(),
        defaultLineData: chartSchema.optional(),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

export const OverallDtrCommunicationSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        period: periodSchema.or(emptyable),
        points: z.array(
          z
            .object({
              label: emptyable,
              communicating: z.union([z.number(), z.string()]).optional(),
              nonCommunicating: z.union([z.number(), z.string()]).optional(),
            })
            .passthrough(),
        ),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

const installationBucketSchema = z
  .object({
    title: emptyable,
    meterCount: z.number(),
    sharePercent: z.number(),
  })
  .passthrough();

export const InstallationSummarySuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        totalMeterCount: z.number(),
        installedMeters: installationBucketSchema,
        nonInstalledMeters: installationBucketSchema,
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

export const DisconnectionDetailsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        months: z.array(
          z
            .object({
              month: emptyable,
              disconnected: z.number(),
              connected: z.number(),
            })
            .passthrough(),
        ),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();
