import { z } from "zod";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const optionalSearchQ = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((s) => s ?? "");

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

/** GET /master-data/meter-master-data — aligned with backend listMeterMasterDataQuerySchema */
export const ListMeterMasterDataQuerySchema = z.object({
  ...paginationFields,
  q: optionalSearchQ,
  organisationLookupId: z.coerce.number().int().positive().optional(),
  networkLookupId: z.coerce.number().int().positive().optional(),
});

/** GET /master-data/dtr-master-data */
export const ListDtrMasterDataQuerySchema = z.object({
  ...paginationFields,
  q: optionalSearchQ,
  organisationLookupId: z.coerce.number().int().positive().optional(),
  networkLookupId: z.coerce.number().int().positive().optional(),
});

/** GET /master-data/consumer-master-data */
export const ListConsumerMasterDataQuerySchema = z
  .object({
    ...paginationFields,
    q: optionalSearchQ,
    organisationLookupId: z.coerce.number().int().positive().optional(),
    networkLookupId: z.coerce.number().int().positive().optional(),
    connectionStatusTblRefId: z.coerce.number().int().positive().optional(),
    categoryTblRefId: z.coerce.number().int().positive().optional(),
    servicePointMeterPhaseTblRefId: z.coerce.number().int().positive().optional(),
    deviceManufacturerTblRefId: z.coerce.number().int().positive().optional(),
    paymentContractTblRefId: z.coerce.number().int().positive().optional(),
    isNetMeter: z
      .enum(["true", "false"])
      .optional()
      .transform((s) =>
        s === "true" ? true : s === "false" ? false : undefined,
      ),
    meterType: z.enum(["all", "live", "test"]).optional().default("all"),
    fromDate: ymd.optional(),
    toDate: ymd.optional(),
  })
  .superRefine((val, ctx) => {
    const hasFrom = val.fromDate != null && val.fromDate !== "";
    const hasTo = val.toDate != null && val.toDate !== "";
    if (hasFrom !== hasTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fromDate and toDate must both be provided or both omitted",
        path: hasFrom ? ["toDate"] : ["fromDate"],
      });
    }
    if (hasFrom && hasTo && val.fromDate! > val.toDate!) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fromDate must be on or before toDate",
        path: ["fromDate"],
      });
    }
  });

/** GET /master-data/feeder-master-data */
export const ListFeederMasterDataQuerySchema = z.object({
  ...paginationFields,
  q: optionalSearchQ,
  organisationLookupId: z.coerce.number().int().positive().optional(),
  networkLookupId: z.coerce.number().int().positive().optional(),
});

/** GET /master-data/substation-master-data */
export const ListSubstationMasterDataQuerySchema = z.object({
  ...paginationFields,
  q: optionalSearchQ,
  organisationLookupId: z.coerce.number().int().positive().optional(),
  networkLookupId: z.coerce.number().int().positive().optional(),
});

/** GET /master-data/meter-communication-status */
export const ListActiveMeterCommunicationQuerySchema = z.object({
  ...paginationFields,
  q: optionalSearchQ,
  meterSerialNumbers: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((s) => {
      if (!s) return undefined;
      const serials = s
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      return serials.length > 0 ? serials.slice(0, 100) : undefined;
    }),
  organisationLookupId: z.coerce.number().int().positive().optional(),
  networkLookupId: z.coerce.number().int().positive().optional(),
  communicationStatus: z.enum(["communicating", "non-communicating"]).optional(),
});

export type ListMeterMasterDataQuery = z.infer<typeof ListMeterMasterDataQuerySchema>;
export type ListDtrMasterDataQuery = z.infer<typeof ListDtrMasterDataQuerySchema>;
export type ListConsumerMasterDataQuery = z.infer<
  typeof ListConsumerMasterDataQuerySchema
>;
export type ListFeederMasterDataQuery = z.infer<typeof ListFeederMasterDataQuerySchema>;
export type ListSubstationMasterDataQuery = z.infer<
  typeof ListSubstationMasterDataQuerySchema
>;
export type ListActiveMeterCommunicationQuery = z.infer<
  typeof ListActiveMeterCommunicationQuerySchema
>;
