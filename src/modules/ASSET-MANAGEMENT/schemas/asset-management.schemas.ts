import { z } from "zod";
import { ApiErrorResponseSchema, PaginationSchema } from "../../../core/schemas/api-response.schemas";

const nullableString = z.string().nullable();

export const AssetMeterSchema = z.object({
  meterLookupId: z.number().int().positive(),
  meterSerialNumber: nullableString,
  latitude: nullableString,
  longitude: nullableString,
});

export const AssetDtrNodeSchema: z.ZodType<AssetDtrNode> = z.lazy(() =>
  z.object({
    networkLookupId: z.number().int().positive(),
    dtrCode: z.string(),
    dtrName: z.string(),
    consumerCount: z.number().int().nonnegative(),
    dtrMeter: AssetMeterSchema.nullable(),
  }),
);

export type AssetDtrNode = {
  networkLookupId: number;
  dtrCode: string;
  dtrName: string;
  consumerCount: number;
  dtrMeter: z.infer<typeof AssetMeterSchema> | null;
};

export const NetworkHierarchyNodeSchema: z.ZodType<NetworkHierarchyNode> = z.lazy(
  () =>
    z.object({
      networkLookupId: z.number().int().positive(),
      networkCode: z.string(),
      networkName: z.string(),
      hierarchyLevel: z.string(),
      children: z.array(NetworkHierarchyNodeSchema),
      dtrs: z.array(AssetDtrNodeSchema),
    }),
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
    z.object({
      organisationLookupId: z.number().int().positive(),
      officeCode: z.string(),
      officeName: z.string(),
      hierarchyLevel: z.string(),
      children: z.array(OrganisationHierarchyNodeSchema),
      dtrs: z.array(AssetDtrNodeSchema),
    }),
  );

export type OrganisationHierarchyNode = {
  organisationLookupId: number;
  officeCode: string;
  officeName: string;
  hierarchyLevel: string;
  children: OrganisationHierarchyNode[];
  dtrs: AssetDtrNode[];
};

export const ConsumerNodeSchema = z.object({
  consumerTblRefId: z.number().int().positive(),
  consumerCid: z.string(),
  consumerName: z.string(),
  consumerAddress: z.string(),
  accountId: z.string(),
  rrNumber: z.string(),
  meters: z.array(AssetMeterSchema),
});

export const NetworkHierarchySuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    hierarchy: z.array(NetworkHierarchyNodeSchema),
  }),
});

export const OrganisationHierarchySuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    hierarchy: z.array(OrganisationHierarchyNodeSchema),
  }),
});

export const DtrDetailSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z
    .object({
      dtrCode: z.string(),
      dtrName: z.string(),
      dtrMeter: AssetMeterSchema.nullable(),
      consumers: z.array(ConsumerNodeSchema),
    })
    .merge(PaginationSchema),
});

export { ApiErrorResponseSchema };
