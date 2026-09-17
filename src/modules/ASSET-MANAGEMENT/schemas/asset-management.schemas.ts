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

export const HierarchyExplorerNodeSchema = z
  .object({
    id: z.number().int().positive(),
    type: requiredName,
    code: emptyableString,
    name: requiredName,
    displayName: requiredName,
    parentId: z.number().int().nullable(),
    hasChildren: z.boolean(),
    childCount: z.number().int().nonnegative(),
    consumerCount: z.number().int().nonnegative().nullable(),
    meterCount: z.number().int().nonnegative().nullable(),
    status: requiredName,
    isDtr: z.boolean(),
  })
  .strict();

export const HierarchyChildrenSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(HierarchyExplorerNodeSchema),
        page: z.number().int().positive(),
        pageSize: z.number().int().positive(),
        total: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const HierarchyExplorerAncestorSchema = z
  .object({
    id: z.number().int().positive(),
    type: requiredName,
    code: emptyableString,
    name: requiredName,
  })
  .strict();

export const HierarchySearchItemSchema = z
  .object({
    node: HierarchyExplorerNodeSchema,
    ancestors: z.array(HierarchyExplorerAncestorSchema),
  })
  .strict();

export const HierarchySearchSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(HierarchySearchItemSchema),
        page: z.number().int().positive(),
        pageSize: z.number().int().positive(),
        total: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const HierarchyExplorerTypeItemSchema = z
  .object({
    id: z.number().int().positive(),
    code: emptyableString,
    name: requiredName,
    order: z.number().int().positive(),
    type: requiredName,
    label: requiredName,
    filterable: z.boolean(),
  })
  .strict();

export const HierarchyTypesSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(HierarchyExplorerTypeItemSchema),
      })
      .strict(),
  })
  .strict();

const nullableCount = z.number().int().nonnegative().nullable();

export const AssetHierarchySummaryRowSchema = z
  .object({
    type: requiredName,
    label: requiredName,
    relationship: z.enum(["SELF", "ANCESTOR", "DESCENDANT"]),
    directCount: nullableCount,
    descendantCount: nullableCount,
  })
  .strict();

export const AssetMeterSummarySchema = z
  .object({
    total: z.number().int().nonnegative(),
    active: nullableCount,
    inactive: nullableCount,
    faulty: nullableCount,
    unknown: nullableCount,
    available: z.boolean(),
  })
  .strict();

export const AssetCommunicationSummarySchema = z
  .object({
    available: z.boolean(),
    consumerOnline: z.number().int().nonnegative(),
    dtrOnline: z.number().int().nonnegative(),
    totalOnline: z.number().int().nonnegative(),
    consumerOffline: z.number().int().nonnegative(),
    dtrOffline: z.number().int().nonnegative(),
    totalOffline: z.number().int().nonnegative(),
  })
  .strict();

export const AssetRecentActivityItemSchema = z
  .object({
    id: requiredName,
    type: requiredName,
    title: requiredName,
    occurredAt: requiredName,
    entityId: z.string().nullable(),
  })
  .strict();

export const AssetRecentActivitySchema = z
  .object({
    available: z.boolean(),
    items: z.array(AssetRecentActivityItemSchema),
    total: z.number().int().nonnegative(),
  })
  .strict();

export const AssetDetailDataSchema = z
  .object({
    id: z.number().int().positive(),
    kind: z.enum(["network", "organisation", "dtr"]),
    type: requiredName,
    code: emptyableString,
    name: requiredName,
    displayName: requiredName,
    status: requiredName,
    hierarchyPath: z.array(HierarchyExplorerAncestorSchema),
    hierarchySummary: z.array(AssetHierarchySummaryRowSchema),
    consumerCount: nullableCount,
    dtrCount: nullableCount,
    meterCount: nullableCount,
    activeMeterCount: nullableCount,
    inactiveMeterCount: nullableCount,
    faultyMeterCount: nullableCount,
    unknownMeterCount: nullableCount,
    assetHealthPercentage: z.number().nullable(),
    assetHealthAvailable: z.boolean(),
    connectedSince: z.string().nullable(),
    lastUpdatedAt: z.string().nullable(),
    meterSummary: AssetMeterSummarySchema.nullable(),
    communicationSummary: AssetCommunicationSummarySchema.nullable(),
    recentActivity: AssetRecentActivitySchema,
  })
  .strict();

export const AssetDetailSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: AssetDetailDataSchema,
  })
  .strict();

export const AssetExportRowSchema = z
  .object({
    hierarchyType: requiredName,
    assetCode: emptyableString,
    assetName: requiredName,
    displayName: requiredName,
    parentType: emptyableString,
    parentCode: emptyableString,
    parentName: emptyableString,
    consumerCount: emptyableString,
    meterCount: emptyableString,
  })
  .strict();

export const MapMarkerKindSchema = z.enum(["consumer", "dtr"]);

export const MapMarkerItemSchema = z
  .object({
    id: requiredName,
    kind: MapMarkerKindSchema,
    assetId: z.number().int().positive(),
    nodeId: z.number().int().positive(),
    name: requiredName,
    code: emptyableString,
    lat: z.number().finite(),
    lng: z.number().finite(),
  })
  .strict();

export const MapMarkersDataSchema = z
  .object({
    markers: z.array(MapMarkerItemSchema),
    count: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    truncated: z.boolean(),
    consumerTotal: z.number().int().nonnegative(),
    dtrTotal: z.number().int().nonnegative(),
    consumerMappedTotal: z.number().int().nonnegative(),
    dtrMappedTotal: z.number().int().nonnegative(),
    onlineCount: z.number().int().nonnegative(),
    offlineCount: z.number().int().nonnegative(),
  })
  .strict();

export const MapMarkersSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    data: MapMarkersDataSchema,
  })
  .strict();

export { ApiErrorResponseSchema };
