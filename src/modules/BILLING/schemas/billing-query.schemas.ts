import { z } from "zod";

const optionalQueryId = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().positive().optional(),
);

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(5000).default(10),
};

/** GET /billing/billing-data — aligned with backend billingDataQuerySchema */
export const BillingDataQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  organisationLookupId: optionalQueryId,
  networkLookupId: optionalQueryId,
  meterNumber: z.string().trim().max(64).optional(),
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((s) => s ?? ""),
  connectionStatusTblRefId: optionalQueryId,
  categoryTblRefId: optionalQueryId,
  servicePointMeterPhaseTblRefId: optionalQueryId,
  deviceManufacturerTblRefId: optionalQueryId,
  paymentContractTblRefId: optionalQueryId,
  isNetMeter: z
    .enum(["true", "false"])
    .optional()
    .transform((s) =>
      s === "true" ? true : s === "false" ? false : undefined,
    ),
  includeTotal: z
    .enum(["true", "false"])
    .optional()
    .transform((s) => s !== "false"),
  ...paginationFields,
});

/** GET /billing/daywise-billing-data */
export const BillingDaywiseDataQuerySchema = BillingDataQuerySchema;

export type BillingDataQuery = z.infer<typeof BillingDataQuerySchema>;
export type BillingDaywiseDataQuery = z.infer<
  typeof BillingDaywiseDataQuerySchema
>;
