import { z } from "zod";
import {
  ApiErrorResponseSchema,
  ColumnSchema,
  PaginationSchema,
} from "../../../core/schemas/api-response.schemas";

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();

function masterDataGridDataSchema<T extends z.ZodTypeAny>(
  rowSchema: T,
  extra?: z.ZodRawShape,
) {
  return z
    .object({
      columns: z.array(ColumnSchema).optional(),
      rows: z.array(rowSchema).optional(),
      items: z.array(rowSchema).optional(),
      pagination: PaginationSchema.optional(),
      total: z.number().int().nonnegative().optional(),
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().optional(),
      totalPages: z.number().int().nonnegative().optional(),
      ...extra,
    })
    .passthrough();
}

function masterDataSuccessResponseSchema<T extends z.ZodTypeAny>(
  rowSchema: T,
  extraData?: z.ZodRawShape,
) {
  return z.object({
    success: z.literal(true),
    data: masterDataGridDataSchema(rowSchema, extraData),
  });
}

export const MeterMasterItemSchema = z
  .object({
    id: z.string(),
    slNo: z.number().int().positive(),
    meterLookupTblRefId: z.number().int().positive(),
    meterSerialNumber: nullableString,
    simNumber: nullableString,
    ismiNumber: nullableString,
    ipAddress: nullableString,
    modemSerialNumber: nullableString,
    modemImeiNumber: nullableString,
    organisationLookupTblRefId: z.number().int().positive(),
    networkLookupTblRefId: z.number().int().positive(),
    isActiveStatus: z.boolean(),
    assetId: nullableString,
    meterRapdrpCode: nullableString,
    mf: z.number(),
  })
  .passthrough();

export const MeterMasterSuccessResponseSchema = masterDataSuccessResponseSchema(
  MeterMasterItemSchema,
);

export const DtrMasterItemSchema = z
  .object({
    id: z.string(),
    slNo: z.number().int().positive(),
    meterLookupTblRefId: z.number().int().positive().optional(),
    circle: nullableString,
    division: nullableString,
    zone: nullableString,
    subStation: nullableString,
    feeder: nullableString,
    dtr: z.string(),
    meterSerialNumber: nullableString,
    mf: nullableString,
    latitude: nullableString,
    longitude: nullableString,
    serviceDate: nullableString,
  })
  .passthrough();

export const DtrMasterSuccessResponseSchema = masterDataSuccessResponseSchema(
  DtrMasterItemSchema,
);

export const ConsumerMasterItemSchema = z
  .object({
    slNo: z.number().int().positive(),
    division: nullableString,
    zone: nullableString,
    feeder: nullableString,
    dtr: nullableString,
    feederNameNew: nullableString,
    dtrNameNew: nullableString,
    consumerCid: z.string(),
    consumerName: z.string(),
    consumerAddress: z.string(),
    consumerMobileNumber: z.string(),
    category: z.string().optional(),
    sanctionedLoadKw: z.number().optional(),
    ivrsNo: z.string(),
    existingIvrsNo: z.string().optional(),
    meterSerialNumber: z.string(),
    meterLookupTblRefId: z.number().int().positive(),
    meterPhase: z.string(),
    mf: z.number().optional(),
    installationDate: z.string().optional(),
    latitude: nullableString,
    longitude: nullableString,
    connectedToDcu: z.boolean().optional(),
    lsCount: nullableNumber,
    dpCount: nullableNumber,
  })
  .passthrough();

export const ConsumerMasterSuccessResponseSchema =
  masterDataSuccessResponseSchema(ConsumerMasterItemSchema);

export const FeederMasterItemSchema = z
  .object({
    slNo: z.number().int().positive(),
    discomName: nullableString,
    regionName: nullableString,
    circleName: nullableString,
    divisionName: nullableString,
    zoneName: nullableString,
    substationName: nullableString,
    feederName: z.string(),
    dtrCount: z.number().int().nonnegative(),
    consumerCount: z.number().int().nonnegative(),
  })
  .passthrough();

export const FeederMasterSuccessResponseSchema = masterDataSuccessResponseSchema(
  FeederMasterItemSchema,
);

export const SubstationMasterItemSchema = z
  .object({
    slNo: z.number().int().positive(),
    discomName: nullableString,
    regionName: nullableString,
    circleName: nullableString,
    divisionName: nullableString,
    zoneName: nullableString,
    substationName: z.string(),
    substationCode: nullableString,
    dtrCount: z.number().int().nonnegative(),
    consumerCount: z.number().int().nonnegative(),
  })
  .passthrough();

export const SubstationMasterSuccessResponseSchema =
  masterDataSuccessResponseSchema(SubstationMasterItemSchema);

export const MeterCommunicationStatusItemSchema = z
  .object({
    slNo: z.number().int().positive(),
    meterSerialNumber: nullableString,
    communicationStatus: z.string(),
    lastCommunication: nullableString,
  })
  .passthrough();

export const MeterCommunicationStatusSuccessResponseSchema =
  masterDataSuccessResponseSchema(MeterCommunicationStatusItemSchema, {
    communicatingCount: z.number().int().nonnegative().optional(),
    nonCommunicatingCount: z.number().int().nonnegative().optional(),
    unknownCount: z.number().int().nonnegative().optional(),
    activeMeters: z.number().int().nonnegative().optional(),
  });

export type ParsedMeterMasterSuccessResponse = z.infer<
  typeof MeterMasterSuccessResponseSchema
>;
export type ParsedDtrMasterSuccessResponse = z.infer<
  typeof DtrMasterSuccessResponseSchema
>;
export type ParsedConsumerMasterSuccessResponse = z.infer<
  typeof ConsumerMasterSuccessResponseSchema
>;
export type ParsedFeederMasterSuccessResponse = z.infer<
  typeof FeederMasterSuccessResponseSchema
>;
export type ParsedSubstationMasterSuccessResponse = z.infer<
  typeof SubstationMasterSuccessResponseSchema
>;
export type ParsedMeterCommunicationStatusSuccessResponse = z.infer<
  typeof MeterCommunicationStatusSuccessResponseSchema
>;

export { ApiErrorResponseSchema as MasterDataErrorResponseSchema };
