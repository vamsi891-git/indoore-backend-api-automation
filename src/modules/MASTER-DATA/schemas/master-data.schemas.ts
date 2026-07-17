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

const ValidateDtrMeterDetailsSchema = z
  .object({
    meterPhaseTblRefId: z.number().int().positive().nullable().optional(),
    simNo: nullableString.optional(),
    imsiNo: nullableString.optional(),
    mobileNo: nullableString.optional(),
    ipAddress: nullableString.optional(),
    modemSerialNumber: nullableString.optional(),
    modemImei: nullableString.optional(),
    meterInitialReading: nullableString.optional(),
    meterInitialReadingDate: nullableString.optional(),
    meterInitialReadingTime: nullableString.optional(),
    mainSubMeterTblRefId: z.number().int().positive().nullable().optional(),
    servicePointId: z.number().int().positive().nullable().optional(),
    dateOfService: nullableString.optional(),
    connectedToDcu: z.boolean().nullable().optional(),
    isNetMeter: z.boolean().nullable().optional(),
  })
  .passthrough();

export const ValidateDtrMeterDataSchema = z
  .object({
    valid: z.boolean(),
    meterExists: z.boolean().optional(),
    reason: z.enum([
      "METER_ALREADY_ON_DTR",
      "METER_INACTIVE",
      "METER_ALREADY_ASSIGNED",
    ]).optional(),
    meterLookupId: z.number().int().positive().optional(),
    meterSerialNumber: z.string().optional(),
    organisationLookupId: z.number().int().positive().optional(),
    networkLookupId: z.number().int().positive().optional(),
    phase: z.string().optional(),
    meterDetais: ValidateDtrMeterDetailsSchema.optional(),
  })
  .passthrough();

export const ValidateDtrMeterSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: ValidateDtrMeterDataSchema,
});

export type ParsedValidateDtrMeterSuccessResponse = z.infer<
  typeof ValidateDtrMeterSuccessResponseSchema
>;

export const CreateMeterDataSchema = z
  .object({
    meterTblRefId: z.number().int().positive(),
    meterLookupTblRefId: z.number().int().positive(),
    meterSerialNumber: z.string().min(1),
    meterRapdrpCode: z.string().min(1),
    assetId: z.string().min(1),
    mf: z.number(),
    deviceManufacturerTblRefId: z.number().int().positive(),
    meterModelTblRefId: z.number().int().positive(),
    meterStatus: z.boolean(),
    dlmsNonDlms: z.string().min(1),
  })
  .passthrough();

export const CreateMeterSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().min(1),
  data: CreateMeterDataSchema,
});

export type ParsedCreateMeterSuccessResponse = z.infer<
  typeof CreateMeterSuccessResponseSchema
>;

export const UpdateMeterDataSchema = CreateMeterDataSchema.extend({
  isActiveStatus: z.boolean(),
}).passthrough();

export const UpdateMeterSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().min(1),
  data: UpdateMeterDataSchema,
});

export type ParsedUpdateMeterSuccessResponse = z.infer<
  typeof UpdateMeterSuccessResponseSchema
>;

export const DeactivateMeterDataSchema = z
  .object({
    meterLookupTblRefId: z.number().int().positive(),
    meterTblRefId: z.number().int().positive(),
    meterSerialNumber: z.string().min(1),
    isActiveStatus: z.literal(false),
    previousIsActiveStatus: z.boolean(),
  })
  .passthrough();

export const DeactivateMeterSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().min(1),
  data: DeactivateMeterDataSchema,
});

export type ParsedDeactivateMeterSuccessResponse = z.infer<
  typeof DeactivateMeterSuccessResponseSchema
>;

export const BulkUploadMeterRowResultSchema = z
  .object({
    rowNumber: z.number().int().positive(),
    meterSerialNumber: z.string(),
    status: z.enum(["CREATED", "FAILED", "VALIDATION_FAILED"]),
    message: z.string().optional(),
    messages: z.array(z.string()).optional(),
    meterTblRefId: z.number().int().positive().optional(),
    meterLookupTblRefId: z.number().int().positive().optional(),
  })
  .passthrough();

export const BulkUploadMetersDataSchema = z.object({
  fileName: z.string().min(1),
  totalRows: z.number().int().nonnegative(),
  createdCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  validationFailedCount: z.number().int().nonnegative(),
  alreadyExistsCount: z.number().int().nonnegative().optional(),
  batchesProcessed: z.number().int().nonnegative(),
  batchSize: z.number().int().positive(),
  rowResults: z.array(BulkUploadMeterRowResultSchema),
});

export const BulkUploadMetersSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().min(1),
  data: BulkUploadMetersDataSchema,
});

/** Row-level validation outcomes return success:false with data.rowResults. */
export const BulkUploadMetersRowOutcomeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().min(1),
  data: BulkUploadMetersDataSchema,
});

export type ParsedBulkUploadMetersSuccessResponse = z.infer<
  typeof BulkUploadMetersSuccessResponseSchema
>;

export const BulkUploadDtrRowResultSchema = z
  .object({
    rowNumber: z.number().int().positive(),
    dtrCode: z.string(),
    meterSerialNumber: z.string(),
    status: z.enum(["CREATED", "FAILED", "VALIDATION_FAILED"]),
    message: z.string().optional(),
    messages: z.array(z.string()).optional(),
    networkLookupId: z.number().int().positive().optional(),
    meterLookupId: z.number().int().positive().optional(),
  })
  .passthrough();

export const BulkUploadDtrDataSchema = z.object({
  fileName: z.string().min(1),
  totalRows: z.number().int().nonnegative(),
  createdCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  validationFailedCount: z.number().int().nonnegative().optional(),
  alreadyExistsCount: z.number().int().nonnegative().optional(),
  batchesProcessed: z.number().int().nonnegative().optional(),
  batchSize: z.number().int().positive().optional(),
  rowResults: z.array(BulkUploadDtrRowResultSchema),
});

export const BulkUploadDtrSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().min(1),
  data: BulkUploadDtrDataSchema,
});

export const BulkUploadDtrRowOutcomeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().min(1),
  data: BulkUploadDtrDataSchema,
});

export type ParsedBulkUploadDtrSuccessResponse = z.infer<
  typeof BulkUploadDtrSuccessResponseSchema
>;

export const BulkUploadConsumersRowResultSchema = z
  .object({
    rowNumber: z.number().int().positive(),
    consumerId: z.string(),
    ivrsNumber: z.string(),
    accountId: z.string(),
    msn: z.string(),
    status: z.enum(["CREATED", "FAILED", "VALIDATION_FAILED"]),
    message: z.string().optional(),
    messages: z.array(z.string()).optional(),
  })
  .passthrough();

export const BulkUploadConsumersDataSchema = z.object({
  fileName: z.string().min(1),
  totalRows: z.number().int().nonnegative(),
  createdCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  validationFailedCount: z.number().int().nonnegative().optional(),
  alreadyExistsCount: z.number().int().nonnegative().optional(),
  rowResults: z.array(BulkUploadConsumersRowResultSchema),
});

export const BulkUploadConsumersSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().min(1),
  data: BulkUploadConsumersDataSchema,
});

export const BulkUploadConsumersRowOutcomeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().min(1),
  data: BulkUploadConsumersDataSchema,
});

export type ParsedBulkUploadConsumersSuccessResponse = z.infer<
  typeof BulkUploadConsumersSuccessResponseSchema
>;

export const CreateDtrDataSchema = z
  .object({
    networkLookupId: z.number().int().positive(),
    meterLookupId: z.number().int().positive(),
    "DTR Code": z.string().min(1),
    "DTR Name": z.string().min(1),
    "DTR Capacity (KVA)": z.number(),
    Status: z.string().min(1),
    MSN: z.string().min(1),
    organisationLookupId: z.number().int().positive(),
    feederNetworkLookupId: z.number().int().positive(),
    subStationNetworkLookupId: z.number().int().positive(),
  })
  .passthrough();

export const CreateDtrSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().min(1),
  data: CreateDtrDataSchema,
});

export type ParsedCreateDtrSuccessResponse = z.infer<
  typeof CreateDtrSuccessResponseSchema
>;

export { ApiErrorResponseSchema as MasterDataErrorResponseSchema };
