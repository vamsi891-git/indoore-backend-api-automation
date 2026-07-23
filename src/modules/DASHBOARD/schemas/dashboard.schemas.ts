import { z } from "zod";

const emptyable = z.string();
const requiredText = z.string().trim().min(1);
const periodSchema = z.enum(["hourly", "daily", "weekly", "monthly", "yearly"]);

const metricItemSchema = z
  .object({
    count: z.union([z.number(), z.string()]),
    percentage: z.union([z.number(), z.string()]).optional(),
    label: emptyable,
  })
  .passthrough();

export const DashboardMetricsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        timestamp: emptyable.optional(),
        connectionStatus: z.record(z.string(), z.unknown()).optional(),
        categoryWiseConsumer: z.record(z.string(), z.unknown()).optional(),
        phaseWiseConsumer: z.record(z.string(), z.unknown()).optional(),
        oemWiseConsumer: z.record(z.string(), z.unknown()).optional(),
        consumerType: z.record(z.string(), z.unknown()).optional(),
        networkDetails: z.record(z.string(), z.unknown()).optional(),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

const summaryMetricSchema = z
  .object({
    label: emptyable,
    count: z.union([z.number(), z.string()]),
    trends: z.array(z.union([z.number(), z.string()])).optional(),
  })
  .passthrough();

export const DtrSummarySuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        period: periodSchema,
        totalDtrs: summaryMetricSchema,
        dtrsOn: summaryMetricSchema,
        dtrsOff: summaryMetricSchema,
        activeAlerts: summaryMetricSchema,
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

export const DtrConsumptionSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        period: periodSchema,
        points: z.array(
          z
            .object({
              label: emptyable,
              kwh: z.union([z.number(), z.string(), z.null()]).optional(),
              kvah: z.union([z.number(), z.string(), z.null()]).optional(),
              kvarh: z.union([z.number(), z.string(), z.null()]).optional(),
            })
            .passthrough(),
        ),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

export const DtrCommunicationSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        period: periodSchema,
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

export const DtrPowerStatusSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        period: periodSchema,
        points: z.array(
          z
            .object({
              label: emptyable,
              dtrsOn: z.union([z.number(), z.string()]).optional(),
              dtrsOff: z.union([z.number(), z.string()]).optional(),
            })
            .passthrough(),
        ),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

const unbalanceItemSchema = z
  .object({
    label: requiredText,
    value: z.union([z.number(), z.string()]),
    percentage: z.union([z.number(), z.string()]),
  })
  .passthrough();

export const DtrLoadUnbalanceSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(unbalanceItemSchema),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

export const DtrVoltageUnbalanceSuccessResponseSchema =
  DtrLoadUnbalanceSuccessResponseSchema;

/** Re-export for DQ tests that expect a metric shape. */
export const DashboardMetricItemSchema = metricItemSchema;
