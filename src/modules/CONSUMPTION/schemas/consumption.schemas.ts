import { z } from "zod";

const emptyable = z.string();
const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();

/** Generic success envelope — tighten per-endpoint as live samples land. */
export const ConsumptionSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.unknown(),
    message: emptyable.optional(),
  })
  .strict();

export const ConsumptionListSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(z.record(z.string(), z.unknown())).optional(),
        modules: z.array(z.record(z.string(), z.unknown())).optional(),
        roles: z.array(z.record(z.string(), z.unknown())).optional(),
        users: z.array(z.record(z.string(), z.unknown())).optional(),
        notifications: z.array(z.record(z.string(), z.unknown())).optional(),
        logs: z.array(z.record(z.string(), z.unknown())).optional(),
        rows: z.array(z.record(z.string(), z.unknown())).optional(),
        pagination: z
          .object({
            page: z.number().optional(),
            limit: z.number().optional(),
            total: z.number().optional(),
            totalPages: z.number().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
    message: emptyable.optional(),
  })
  .strict();

export const ConsumptionReportPaginationSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export const DailyConsumptionItemSchema = z
  .object({
    slNo: z.number().int(),
    division: nullableString,
    zone: nullableString,
    subStation: nullableString,
    feeder: nullableString,
    dtr: nullableString,
    name: nullableString,
    ivrsNumber: nullableString,
    msn: nullableString,
    phase: nullableString,
    mf: nullableNumber.optional(),
    serviceDate: nullableString,
    minDate: nullableString,
    maxDate: nullableString,
    ir: nullableNumber,
    fr: nullableNumber,
    kwh: nullableNumber,
  })
  .passthrough();

export const DailyConsumptionResponseSchema = z.object({
  success: z.literal(true),
  data: ConsumptionReportPaginationSchema.extend({
    items: z.array(DailyConsumptionItemSchema),
  }),
});

export const HourlyConsumptionResponseSchema = z.object({
  success: z.literal(true),
  data: ConsumptionReportPaginationSchema.extend({
    items: z.array(z.record(z.string(), z.unknown())),
  }),
});

export const MonthlyConsumptionItemSchema = z
  .object({
    slNo: z.number().int(),
    division: nullableString,
    zone: nullableString,
    subStation: nullableString,
    feeder: nullableString,
    dtr: nullableString,
    name: nullableString,
    address: z.string(),
    ivrsNumber: nullableString,
    tariff: nullableString,
    msn: nullableString,
    phase: nullableString,
    kwh: nullableNumber,
    kvah: nullableNumber,
    mdKw: nullableNumber,
    mdKvah: nullableNumber,
  })
  .passthrough();

export const MonthlyConsumptionResponseSchema = z.object({
  success: z.literal(true),
  data: ConsumptionReportPaginationSchema.extend({
    items: z.array(MonthlyConsumptionItemSchema),
  }),
});

export const NightZeroConsumptionItemSchema = z
  .object({
    slNo: z.number().int(),
    circle: nullableString,
    division: nullableString,
    subDivision: nullableString,
    zone: nullableString,
    feeder: nullableString,
    dtr: nullableString,
    name: nullableString,
    address: z.string(),
    ivrsNumber: nullableString,
    tariff: nullableString,
    msn: nullableString,
    phase: nullableString,
    mf: nullableNumber,
    nightKwh: nullableNumber,
    dayKwh: nullableNumber,
    totalKwh: nullableNumber,
    eventCount: nullableNumber,
    durationMinutes: nullableNumber,
  })
  .passthrough();

export const NightZeroConsumptionResponseSchema = z.object({
  success: z.literal(true),
  data: ConsumptionReportPaginationSchema.extend({
    items: z.array(NightZeroConsumptionItemSchema),
  }),
});

export const MonthlyNetMeterItemSchema = z
  .object({
    slNo: z.number().int(),
    circle: nullableString,
    division: nullableString,
    subDivision: nullableString,
    zone: nullableString,
    feeder: nullableString,
    dtr: nullableString,
    name: nullableString,
    address: z.string().nullable(),
    ivrsNumber: nullableString,
    category: nullableString,
    msn: nullableString,
    phase: nullableString,
    subStation: nullableString,
    kwh: nullableNumber,
    kvah: nullableNumber,
    kwhExport: nullableNumber,
    kvahExport: nullableNumber,
    netKwh: nullableNumber,
    netKvah: nullableNumber,
  })
  .passthrough();

export const MonthlyNetMeterResponseSchema = z.object({
  success: z.literal(true),
  data: ConsumptionReportPaginationSchema.extend({
    items: z.array(MonthlyNetMeterItemSchema),
  }),
});

const PatternTableColumnSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
  })
  .passthrough();

const PatternTablePaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

const PatternLastThreeRowSchema = z
  .object({
    slNo: z.number().int(),
    consumerConnectionTblRefId: z.number().int().optional(),
    circle: nullableString,
    division: nullableString,
    zone: nullableString,
    subStation: nullableString,
    offName: nullableString.optional(),
    feeder: nullableString,
    dtr: nullableString,
    name: nullableString,
    address: z.string().nullable(),
    ivrsNumber: nullableString,
    tariff: nullableString,
    msn: nullableString,
    meterMake: nullableString,
    phase: nullableString,
    sanctionLoadKw: nullableNumber,
    m0Kwh: nullableNumber,
    m0Kvah: nullableNumber,
    m0Md: nullableNumber,
    m1Kwh: nullableNumber,
    m1Kvah: nullableNumber,
    m1Md: nullableNumber,
    m2Kwh: nullableNumber,
    m2Kvah: nullableNumber,
    m2Md: nullableNumber,
  })
  .passthrough();

const PatternYearlyRowSchema = z
  .object({
    slNo: z.number().int(),
    consumerConnectionTblRefId: z.number().int().optional(),
    circle: nullableString,
    division: nullableString,
    zone: nullableString,
    subStation: nullableString,
    feeder: nullableString,
    dtr: nullableString,
    name: nullableString,
    address: z.string().nullable(),
    ivrsNumber: nullableString,
    tariff: nullableString,
    msn: nullableString,
    meterMake: nullableString,
    phase: nullableString,
    serviceDate: nullableString,
    sanctionLoadKw: nullableNumber,
    janKwh: nullableNumber,
    janMdKw: nullableNumber,
    febKwh: nullableNumber,
    febMdKw: nullableNumber,
    marKwh: nullableNumber,
    marMdKw: nullableNumber,
    aprKwh: nullableNumber,
    aprMdKw: nullableNumber,
    mayKwh: nullableNumber,
    mayMdKw: nullableNumber,
    junKwh: nullableNumber,
    junMdKw: nullableNumber,
    julKwh: nullableNumber,
    julMdKw: nullableNumber,
    augKwh: nullableNumber,
    augMdKw: nullableNumber,
    sepKwh: nullableNumber,
    sepMdKw: nullableNumber,
    octKwh: nullableNumber,
    octMdKw: nullableNumber,
    novKwh: nullableNumber,
    novMdKw: nullableNumber,
    decKwh: nullableNumber,
    decMdKw: nullableNumber,
    initialKwh: nullableNumber,
  })
  .passthrough();

const PatternComparisonRowSchema = z
  .object({
    slNo: z.number().int(),
    consumerConnectionTblRefId: z.number().int().optional(),
    circle: nullableString,
    division: nullableString,
    zone: nullableString,
    subStation: nullableString,
    feeder: nullableString,
    dtr: nullableString,
    name: nullableString,
    address: z.string().nullable(),
    ivrsNumber: nullableString,
    categoryName: nullableString,
    meterSerialNo: nullableString,
    meterMake: nullableString,
    phase: nullableString,
    sanctionLoadKw: nullableNumber,
    currentMonthKwh: nullableNumber,
    lastMonthKwh: nullableNumber,
    lastYearSameMonthKwh: nullableNumber,
  })
  .passthrough();

function patternTableResponseSchema<T extends z.ZodTypeAny>(rowSchema: T) {
  return z.object({
    success: z.literal(true),
    data: z.object({
      table: z.object({
        title: z.string().min(1),
        columns: z.array(PatternTableColumnSchema),
        rows: z.array(rowSchema),
        pagination: PatternTablePaginationSchema,
      }),
    }),
  });
}

export const PatternLastThreeResponseSchema =
  patternTableResponseSchema(PatternLastThreeRowSchema);
export const PatternYearlyResponseSchema =
  patternTableResponseSchema(PatternYearlyRowSchema);
export const PatternComparisonResponseSchema =
  patternTableResponseSchema(PatternComparisonRowSchema);
