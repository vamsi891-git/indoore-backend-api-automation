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
        total: z.union([z.number(), z.string()]).optional(),
        items: z.array(unbalanceItemSchema),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

export const DtrVoltageUnbalanceSuccessResponseSchema =
  DtrLoadUnbalanceSuccessResponseSchema;

const unbalanceDetailsColumnSchema = z
  .object({
    key: requiredText,
    header: requiredText,
  })
  .passthrough();

const unbalanceDetailsPaginationSchema = z
  .object({
    page: z.union([z.number(), z.string()]),
    limit: z.union([z.number(), z.string()]),
    total: z.union([z.number(), z.string()]),
    totalPages: z.union([z.number(), z.string()]),
  })
  .passthrough();

export const DtrLoadUnbalanceDetailsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        columns: z.array(unbalanceDetailsColumnSchema),
        rows: z.array(z.record(z.string(), z.unknown())),
        pagination: unbalanceDetailsPaginationSchema,
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

export const DtrVoltageUnbalanceDetailsSuccessResponseSchema =
  DtrLoadUnbalanceDetailsSuccessResponseSchema;

export const DtrPowerStatusDetailsSuccessResponseSchema =
  DtrLoadUnbalanceDetailsSuccessResponseSchema;

export const DtrCommunicationDetailsSuccessResponseSchema =
  DtrLoadUnbalanceDetailsSuccessResponseSchema;

export const DtrConsumptionDetailsSuccessResponseSchema =
  DtrLoadUnbalanceDetailsSuccessResponseSchema;

export const DtrPercentageLoadingDetailsSuccessResponseSchema =
  DtrLoadUnbalanceDetailsSuccessResponseSchema;

export const ConsumerConnectionStatusSuccessResponseSchema =
  DtrLoadUnbalanceDetailsSuccessResponseSchema;

export const ConsumerCategoryDistributionSuccessResponseSchema =
  DtrLoadUnbalanceDetailsSuccessResponseSchema;

export const ConsumerPhaseDistributionSuccessResponseSchema =
  DtrLoadUnbalanceDetailsSuccessResponseSchema;

export const ConsumerOemDistributionSuccessResponseSchema =
  DtrLoadUnbalanceDetailsSuccessResponseSchema;

const meterCountAmountSchema = z
  .object({
    meterCount: z.union([z.number(), z.string()]),
    amount: z.union([z.number(), z.string()]),
  })
  .passthrough();

export const RevenueSubsidyPfSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        id: requiredText,
        periodYear: z.union([z.number(), z.string()]),
        periodMonth: z.union([z.number(), z.string()]),
        billingAvailability: meterCountAmountSchema,
        billingEfficiency: z
          .object({
            energyLu: z.union([z.number(), z.string()]),
            amount: z.union([z.number(), z.string()]),
          })
          .passthrough(),
        revenueGainedRpu: z
          .object({
            inputLu: z.union([z.number(), z.string()]),
            rpu: z.union([z.number(), z.string()]),
            amount: z.union([z.number(), z.string()]),
          })
          .passthrough(),
        subsidyAmount: z.union([z.number(), z.string()]),
        incentivePf: meterCountAmountSchema,
        penaltyPf: meterCountAmountSchema,
        billCount: z.union([z.number(), z.string()]),
        overallImprovement: z.union([z.number(), z.string()]),
        overallImprovementCr: z.union([z.number(), z.string()]),
        avgImprovement: z.union([z.number(), z.string()]).nullable(),
        createdByUserId: requiredText,
        updatedByUserId: requiredText,
        createdAt: requiredText,
        updatedAt: requiredText,
      })
      .passthrough()
      .nullable(),
    message: emptyable.optional(),
  })
  .strict();

/** Re-export for DQ tests that expect a metric shape. */
export const DashboardMetricItemSchema = metricItemSchema;
