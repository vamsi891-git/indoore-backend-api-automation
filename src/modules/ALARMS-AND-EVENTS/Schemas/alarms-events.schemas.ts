import { z } from "zod";
import {
  ApiErrorResponseSchema,
  ColumnSchema,
  PaginationSchema,
} from "../../../core/schemas/api-response.schemas";

export { ApiErrorResponseSchema };

export const AlarmsEventsPhaseDrillRowSchema = z
  .object({
    id: z.string().min(1),
    eventId: z.number().int().positive(),
    eventName: z.string().min(1),
    eventClassificationName: z.string().min(1),
    meterCount: z.number().nonnegative(),
    eventCount: z.number().nonnegative(),
    duration: z.string().regex(/^\d+:\d{2}$/),
    circleId: z.number().int().positive(),
    circleName: z.string().min(1),
  })
  .passthrough();

export const AlarmsEventsPhaseDrillSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        columns: z.array(ColumnSchema),
        rows: z.array(AlarmsEventsPhaseDrillRowSchema),
        pagination: PaginationSchema,
        context: z
          .object({
            view: z.literal("phase-wise"),
            groupBy: z.literal("circle"),
            fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            series: z.string(),
            hierarchyLevel: z.literal("circle"),
            category: z.string().min(1),
          })
          .passthrough(),
        totals: z
          .object({
            totalMeterCount: z.number().nonnegative(),
            totalEventCount: z.number().nonnegative(),
            totalRows: z.number().int().nonnegative(),
          })
          .passthrough(),
      })
      .strict(),
  })
  .strict();

export const AlarmsEventsCategoryDrillSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        columns: z.array(ColumnSchema),
        rows: z.array(AlarmsEventsPhaseDrillRowSchema),
        pagination: PaginationSchema,
        context: z
          .object({
            view: z.literal("category-wise"),
            groupBy: z.literal("circle"),
            fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            series: z.string(),
            hierarchyLevel: z.literal("circle"),
            category: z.string().min(1),
          })
          .passthrough(),
        totals: z
          .object({
            totalMeterCount: z.number().nonnegative(),
            totalEventCount: z.number().nonnegative(),
            totalRows: z.number().int().nonnegative(),
          })
          .passthrough(),
      })
      .strict(),
  })
  .strict();

export const AlarmsEventsPriorityDrillRowSchema = z
  .object({
    id: z.string().min(1),
    eventId: z.number().int().positive(),
    eventName: z.string().min(1),
    eventClassificationName: z.string().min(1).nullable(),
    meterCount: z.number().nonnegative(),
    eventCount: z.number().nonnegative(),
    duration: z.string().regex(/^\d+:\d{2}$/),
    circleId: z.number().int().positive(),
    circleName: z.string().min(1),
  })
  .passthrough();

export const AlarmsEventsPriorityDrillSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        columns: z.array(ColumnSchema),
        rows: z.array(AlarmsEventsPriorityDrillRowSchema),
        pagination: PaginationSchema,
        context: z
          .object({
            view: z.literal("priority-wise"),
            groupBy: z.literal("circle"),
            fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            series: z.string(),
            hierarchyLevel: z.literal("circle"),
            priority: z.string().min(1),
            category: z.string().min(1).optional(),
          })
          .passthrough(),
        totals: z
          .object({
            totalMeterCount: z.number().nonnegative(),
            totalEventCount: z.number().nonnegative(),
            totalRows: z.number().int().nonnegative(),
          })
          .passthrough(),
      })
      .strict(),
  })
  .strict();

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const AlarmsEventsCategoryWiseRowSchema = z
  .object({
    category: z.string().min(1),
    label: z.string().min(1),
    totalCount: z.number().nonnegative(),
    count: z.number().nonnegative(),
    previousCount: z.number().nonnegative(),
  })
  .passthrough();

export const AlarmsEventsCategoryWiseSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        currentDate: ymd,
        previousDate: ymd,
        totalEvents: z.number().nonnegative(),
        totalEventsPreviousDay: z.number().nonnegative(),
        categories: z.array(AlarmsEventsCategoryWiseRowSchema).min(1),
      })
      .strict(),
  })
  .strict();

const categoryChartBucketSchema = z
  .object({
    meterCount: z.number().nonnegative(),
    percentage: z.number().min(0).max(100),
  })
  .passthrough();

const categoryChartPeriodSchema = z
  .object({
    period: z.enum(["hourly", "daily", "weekly", "monthly"]),
    totalMeterCount: z.number().nonnegative(),
    categories: z.record(z.string(), categoryChartBucketSchema),
  })
  .passthrough();

export const AlarmsEventsCategoryChartSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        category: z.string().min(1),
        label: z.string().min(1),
        hourly: categoryChartPeriodSchema,
        daily: categoryChartPeriodSchema,
        weekly: categoryChartPeriodSchema,
        monthly: categoryChartPeriodSchema,
      })
      .strict(),
  })
  .strict();

const statusBucketSchema = z
  .object({
    totalCount: z.number().nonnegative(),
    currentDay: z.number().nonnegative(),
    previousDay: z.number().nonnegative(),
  })
  .passthrough();

export const AlarmsEventsPriorityWiseRowSchema = z
  .object({
    priorityId: z.number().int().nonnegative(),
    label: z.string().min(1),
    totalCount: z.number().nonnegative(),
    count: z.number().nonnegative(),
    previousCount: z.number().nonnegative(),
  })
  .passthrough();

export const AlarmsEventsPriorityWiseSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        currentDate: ymd,
        previousDate: ymd,
        totalEvents: z.number().nonnegative(),
        totalEventsPreviousDay: z.number().nonnegative(),
        active: statusBucketSchema,
        resolve: statusBucketSchema,
        priorities: z.array(AlarmsEventsPriorityWiseRowSchema).min(1),
      })
      .strict(),
  })
  .strict();

const priorityChartDatasetSchema = z
  .object({
    label: z.string().min(1),
    data: z.array(z.number().nonnegative()),
    meterCount: z.array(z.number().nonnegative()),
  })
  .passthrough();

const priorityChartPeriodSchema = z
  .object({
    period: z.enum(["hourly", "daily", "weekly", "monthly"]),
    fromDate: ymd,
    toDate: ymd,
    totalCount: z.number().nonnegative(),
    labels: z.array(z.string().min(1)).min(1),
    datasets: z.array(priorityChartDatasetSchema).min(1),
  })
  .passthrough();

export const AlarmsEventsPriorityChartSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        priority: z.string().min(1),
        label: z.string().min(1),
        hourly: priorityChartPeriodSchema,
        daily: priorityChartPeriodSchema,
        weekly: priorityChartPeriodSchema,
        monthly: priorityChartPeriodSchema,
      })
      .strict(),
  })
  .strict();