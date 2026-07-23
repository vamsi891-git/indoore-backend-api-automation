import { z } from "zod";
import {
  ApiErrorResponseSchema,
  PaginationSchema,
} from "../../../core/schemas/api-response.schemas";

/**
 * Backend often returns "" for optional codes / sparse master data.
 * Validators treat empty codes as soft (log); names stay required.
 */
const requiredName = z.string().trim().min(1);
const emptyableString = z.string();
/** Serial / coords: string or null; empty string allowed. */
const optionalTrimmedString = z.string().nullable();

export const AssetMeterSchema = z
  .object({
    meterLookupId: z.number().int().positive(),
    meterSerialNumber: optionalTrimmedString,
    latitude: optionalTrimmedString,
    longitude: optionalTrimmedString,
  })
  .strict();

export const AssetDtrNodeSchema: z.ZodType<AssetDtrNode> = z.lazy(() =>
  z
    .object({
      networkLookupId: z.number().int().positive(),
      dtrCode: emptyableString,
      dtrName: requiredName,
      consumerCount: z.number().int().nonnegative(),
      dtrMeter: AssetMeterSchema.nullable(),
    })
    .strict(),
);

export type AssetDtrNode = {
  networkLookupId: number;
  dtrCode: string;
  dtrName: string;
  consumerCount: number;
  dtrMeter: z.infer<typeof AssetMeterSchema> | null;
};

export const NetworkHierarchyNodeSchema: z.ZodType<NetworkHierarchyNode> =
  z.lazy(() =>
    z
      .object({
        networkLookupId: z.number().int().positive(),
        networkCode: emptyableString,
        networkName: requiredName,
        hierarchyLevel: requiredName,
        children: z.array(NetworkHierarchyNodeSchema),
        dtrs: z.array(AssetDtrNodeSchema),
      })
      .strict(),
  );

export type NetworkHierarchyNode = {
  networkLookupId: number;
  networkCode: string;
  networkName: string;
  hierarchyLevel: string;
  children: NetworkHierarchyNode[];
  dtrs: AssetDtrNode[];
};

export const OrganisationHierarchyNodeSchema: z.ZodType<OrganisationHierarchyNode> =
  z.lazy(() =>
    z
      .object({
        organisationLookupId: z.number().int().positive(),
        officeCode: emptyableString,
        officeName: requiredName,
        hierarchyLevel: requiredName,
        children: z.array(OrganisationHierarchyNodeSchema),
        dtrs: z.array(AssetDtrNodeSchema),
      })
      .strict(),
  );

export type OrganisationHierarchyNode = {
  organisationLookupId: number;
  officeCode: string;
  officeName: string;
  hierarchyLevel: string;
  children: OrganisationHierarchyNode[];
  dtrs: AssetDtrNode[];
};

export const ConsumerNodeSchema = z
  .object({
    consumerTblRefId: z.number().int().positive(),
    consumerCid: emptyableString,
    consumerName: requiredName,
    consumerAddress: emptyableString,
    accountId: emptyableString,
    rrNumber: emptyableString,
    meters: z.array(AssetMeterSchema),
  })
  .strict();

export const NetworkHierarchySuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      hierarchy: z.array(NetworkHierarchyNodeSchema),
    }),
  })
  .strict();

export const OrganisationHierarchySuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      hierarchy: z.array(OrganisationHierarchyNodeSchema),
    }),
  })
  .strict();

const DtrDetailDataSchema = z
  .object({
    dtrCode: emptyableString,
    dtrName: requiredName,
    dtrMeter: AssetMeterSchema.nullable(),
    consumers: z.array(ConsumerNodeSchema),
  })
  .merge(PaginationSchema)
  .strict();

export const DtrDetailSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: DtrDetailDataSchema,
  })
  .strict();

export { ApiErrorResponseSchema };
