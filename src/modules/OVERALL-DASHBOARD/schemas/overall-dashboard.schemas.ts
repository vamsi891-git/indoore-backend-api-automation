import { z } from "zod";

const emptyable = z.string();
const periodSchema = z.enum(["hourly", "daily", "weekly", "monthly", "yearly"]);

export const OverallDashboardMetricsSuccessResponseSchema = z
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
