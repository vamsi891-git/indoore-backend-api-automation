import { z } from "zod";

/** Sparse master fields may be "". Names / ids stay hard where validators require them. */
const emptyable = z.string();
const requiredName = z.string().trim().min(1);
const metricCard = z
  .object({
    title: emptyable,
    value: z.union([z.number(), z.string(), z.null()]).optional(),
    unit: emptyable.optional(),
    subtitle: emptyable.optional(),
    percent: z.number().optional(),
    display: emptyable.optional(),
  })
  .passthrough();

export const ConsumerProfileSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        consumerName: requiredName,
        consumerEmail: emptyable.nullable().optional(),
        consumerNumber: emptyable.nullable().optional(),
        uniqueId: emptyable.nullable().optional(),
        meterSerialNumber: emptyable.nullable().optional(),
        permanentAddress: emptyable.nullable().optional(),
        billingAddress: emptyable.nullable().optional(),
        occupancyStatus: emptyable.nullable().optional(),
        connectionDetails: z.record(z.string(), z.unknown()).optional(),
        connectionMeterDetails: z.record(z.string(), z.unknown()).optional(),
        latestActivities: z.array(z.record(z.string(), z.unknown())).optional(),
      })
      .passthrough(),
  })
  .strict();

export const CommunicationStatusSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        date: emptyable,
        latestReadingDateTime: emptyable.nullable().optional(),
        intervals: z.record(z.string(), z.unknown()),
        delayed: z.record(z.string(), z.unknown()),
      })
      .passthrough(),
  })
  .strict();

export const BillingHistoryRowSchema = z
  .object({
    periodLabel: emptyable.nullable(),
    consumptionKwh: z.number().nullable(),
    billAmount: z.number().nullable(),
    consumptionSummaryText: emptyable.nullable(),
    paymentStatus: emptyable.nullable(),
  })
  .strict();

export const BillingHistorySuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(BillingHistoryRowSchema),
  })
  .strict();

export const BillingPeriodSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.record(z.string(), z.unknown()),
  })
  .strict();

export const EnergyConsumptionGraphSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        period: requiredName,
        points: z.array(
          z
            .object({
              label: emptyable,
              consumptionKwh: z.number().nullable(),
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();

export const EnergyFlowSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        period: requiredName,
        points: z.array(
          z
            .object({
              label: emptyable,
              kwhImport: z.number().nullable(),
              kvahImport: z.number().nullable(),
              kwhExport: z.number().nullable(),
              kvahExport: z.number().nullable(),
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();

export const EventLogCardsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        resolvedEvents: z.record(z.string(), z.unknown()),
        pendingEvents: z.record(z.string(), z.unknown()),
        avgResolutionTime: z.record(z.string(), z.unknown()),
      })
      .passthrough(),
  })
  .strict();

export const EventLogListSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        rows: z.array(
          z
            .object({
              serialNo: z.number().int().positive(),
              meterNo: emptyable.nullable(),
              occurDateTime: emptyable,
              restoreDateTime: emptyable.nullable(),
              description: emptyable.nullable(),
              durationDisplay: emptyable.nullable(),
              status: z.enum(["Resolved", "Pending"]),
            })
            .strict(),
        ),
        page: z.number().int().positive(),
        pageSize: z.number().int().positive(),
        totalCount: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const LiveLoadProfileSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        lastReadingIso: emptyable.nullable().optional(),
        meterPhase: z.enum(["SP", "TP"]).nullable().optional(),
        total: z.union([z.number(), z.string(), z.null()]).optional(),
        metrics: z.array(metricCard).optional(),
      })
      .passthrough()
      .nullable(),
  })
  .strict();

export const PowerQualitySuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        overallPf: metricCard.nullable().optional(),
        frequency: metricCard.nullable().optional(),
        neutralCurrent: metricCard.nullable().optional(),
        mdKw: metricCard.nullable().optional(),
        mdKva: metricCard.nullable().optional(),
      })
      .passthrough()
      .nullable(),
  })
  .strict();

export const RealTimePowerSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.record(z.string(), z.unknown()).nullable(),
  })
  .strict();

export const ValidateMeterSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        valid: z.boolean(),
        meterExists: z.boolean().optional(),
        reason: emptyable.nullable().optional(),
        meterLookupId: z.number().int().positive().nullable().optional(),
        meterSerialNumber: emptyable.nullable().optional(),
        organisationLookupId: z.number().int().nullable().optional(),
        networkLookupId: z.number().int().nullable().optional(),
        phase: emptyable.nullable().optional(),
        meterDetails: z.record(z.string(), z.unknown()).nullable().optional(),
      })
      .passthrough(),
  })
  .strict();

export const NearestAccountIdsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        accountId: emptyable,
        numericSuffix: emptyable.nullable().optional(),
        maxDistance: z.number().nullable().optional(),
        nearestAccountIds: z.array(
          z
            .object({
              accountId: emptyable,
              distance: z.number().optional(),
            })
            .passthrough(),
        ),
      })
      .passthrough(),
  })
  .strict();

export const ActivationSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        consumer: z
          .object({
            cid: emptyable,
            tblRefId: z.number().int().positive(),
            name: requiredName,
            status: emptyable,
          })
          .strict(),
        previousStatus: emptyable,
      })
      .strict(),
  })
  .strict();
