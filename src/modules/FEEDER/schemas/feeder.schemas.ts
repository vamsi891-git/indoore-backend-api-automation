import { z } from "zod";

const emptyable = z.string();
const requiredText = z.string().trim().min(1);

const overviewItemSchema = z
  .object({
    title: requiredText,
    value: emptyable.nullable(),
  })
  .passthrough();

export const FeederProfileSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        feederCode: requiredText,
        feederName: emptyable.nullable(),
        status: requiredText,
        parentDtr: z
          .object({
            dtrCode: emptyable,
            dtrName: emptyable,
          })
          .passthrough()
          .nullable(),
        overview: z.array(overviewItemSchema),
      })
      .passthrough(),
  })
  .strict();

const alertRowSchema = z
  .object({
    serialNo: z.number().int().positive(),
    eventType: emptyable.nullable(),
    meterNumber: emptyable.nullable(),
    occurredOn: emptyable,
    duration: emptyable.nullable(),
    status: z.enum(["Active", "Resolved"]),
  })
  .passthrough();

export const FeederAlertsSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        rows: z.array(alertRowSchema),
        page: z.number().int().positive(),
        pageSize: z.number().int().positive(),
        totalCount: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
      })
      .passthrough(),
  })
  .strict();

const phaseSchema = z
  .object({
    voltage: z.number().nullable(),
    voltageUnit: emptyable,
    current: z.number().nullable(),
    currentUnit: emptyable,
  })
  .passthrough();

export const FeederElectricalParametersSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        lastCommunication: emptyable.nullable(),
        meterSerialNumber: emptyable.nullable(),
        "R-Phase": phaseSchema,
        "Y-Phase": phaseSchema,
        "B-Phase": phaseSchema,
      })
      .passthrough(),
  })
  .strict();

const consumptionPointSchema = z
  .object({
    label: emptyable,
    key: emptyable,
    kwh: z.number().nullable(),
  })
  .passthrough();

export const FeederDailyConsumptionSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        granularity: z.enum(["day", "monthly"]),
        unit: requiredText,
        points: z.array(consumptionPointSchema),
      })
      .passthrough(),
  })
  .strict();
