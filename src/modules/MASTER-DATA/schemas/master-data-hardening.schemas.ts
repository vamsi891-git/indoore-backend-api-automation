import { z } from "zod";
import {
  MeterMasterItemSchema,
  DtrMasterItemSchema,
  ConsumerMasterItemSchema,
  FeederMasterItemSchema,
  SubstationMasterItemSchema,
  MeterCommunicationStatusItemSchema,
} from "./master-data.schemas";
import { ColumnSchema, PaginationSchema } from "../../../core/schemas/api-response.schemas";

/**
 * Strict envelopes for mutation-proof (reject unexpected root keys).
 * Item shapes reuse the richer passthrough schemas from master-data.schemas.ts.
 */

function strictListSuccessSchema<T extends z.ZodTypeAny>(rowSchema: T) {
  return z
    .object({
      success: z.literal(true),
      data: z
        .object({
          columns: z.array(ColumnSchema).optional(),
          rows: z.array(rowSchema).optional(),
          items: z.array(rowSchema).optional(),
          pagination: PaginationSchema.optional(),
          total: z.number().int().nonnegative().optional(),
          page: z.number().int().positive().optional(),
          limit: z.number().int().positive().optional(),
          totalPages: z.number().int().nonnegative().optional(),
        })
        .passthrough(),
      message: z.string().optional(),
    })
    .strict();
}

export const MeterMasterStrictSuccessResponseSchema =
  strictListSuccessSchema(MeterMasterItemSchema);

export const DtrMasterStrictSuccessResponseSchema =
  strictListSuccessSchema(DtrMasterItemSchema);

export const ConsumerMasterStrictSuccessResponseSchema =
  strictListSuccessSchema(ConsumerMasterItemSchema);

export const FeederMasterStrictSuccessResponseSchema =
  strictListSuccessSchema(FeederMasterItemSchema);

export const SubstationMasterStrictSuccessResponseSchema =
  strictListSuccessSchema(SubstationMasterItemSchema);

export const MeterCommunicationStrictSuccessResponseSchema =
  strictListSuccessSchema(MeterCommunicationStatusItemSchema);

/** Generic fallback used by scaffold / DQ-only cases. */
export const MasterDataSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.unknown(),
    message: z.string().optional(),
  })
  .strict();

export const MasterDataListSuccessResponseSchema = MasterDataSuccessResponseSchema;
