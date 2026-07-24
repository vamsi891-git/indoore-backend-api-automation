/** Fixture envelopes for MASTER-DATA list mutation-proof (aligned with live shapes). */

export const sampleMeterMasterSuccess = {
  success: true as const,
  data: {
    columns: [{ key: "meterSerialNumber", header: "Meter Serial" }],
    rows: [
      {
        id: "140128",
        slNo: 1,
        meterLookupTblRefId: 140128,
        meterSerialNumber: "000248045",
        simNumber: null,
        ismiNumber: null,
        ipAddress: null,
        modemSerialNumber: null,
        modemImeiNumber: null,
        organisationLookupTblRefId: 9,
        networkLookupTblRefId: 3,
        isActiveStatus: true,
        assetId: null,
        meterRapdrpCode: null,
        mf: 1,
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  },
};

export const sampleDtrMasterSuccess = {
  success: true as const,
  data: {
    columns: [{ key: "dtr", header: "DTR" }],
    rows: [
      {
        id: "109150",
        slNo: 1,
        meterLookupTblRefId: 109150,
        circle: "Indore city circle",
        division: "WEST",
        zone: "GPH",
        subStation: "Citi Control Room",
        feeder: "IMLI BAZAR(CHQ)",
        dtr: "10IW1",
        meterSerialNumber: "19271515",
        mf: "60",
        latitude: "22.724878",
        longitude: "75.852221",
        serviceDate: "2020-01-06 19:46:06.7",
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};

export const sampleConsumerMasterSuccess = {
  success: true as const,
  data: {
    columns: [{ key: "consumerName", header: "Consumer" }],
    rows: [
      {
        id: "9921425000",
        slNo: 1,
        division: "West",
        zone: "SANGAM NAGAR",
        feeder: "8022736805",
        dtr: "WI4016",
        feederNameNew: "KUSHWAH NAGAR(CHQ)",
        dtrNameNew: "SGM0000260",
        consumerCid: "9921425000",
        consumerName: "AMARJIT VIRSINGH",
        consumerAddress: "RAJARAM NAGAR",
        consumerMobileNumber: "",
        category: "LV1.2",
        sanctionedLoadKw: 1,
        ivrsNo: "N3471011444",
        existingIvrsNo: "N3471011444",
        meterSerialNumber: "92572793",
        meterLookupTblRefId: 93754,
        meterPhase: "1-Ph",
        mf: 1,
        latitude: null,
        longitude: null,
        lsCount: null,
        dpCount: null,
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};

export const sampleFeederMasterSuccess = {
  success: true as const,
  data: {
    columns: [{ key: "feederName", header: "Feeder" }],
    rows: [
      {
        slNo: 1,
        discomName: null,
        regionName: null,
        circleName: null,
        divisionName: null,
        zoneName: "CITI1",
        substationName: "HTAMRSS",
        feederName: "33 KV Sarwan",
        dtrCount: 1,
        consumerCount: 1,
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};

export const sampleSubstationMasterSuccess = {
  success: true as const,
  data: {
    columns: [{ key: "substationName", header: "Substation" }],
    rows: [
      {
        slNo: 1,
        discomName: null,
        regionName: null,
        circleName: null,
        divisionName: null,
        zoneName: "CITI1",
        substationName: "Airport Grid",
        substationCode: "SS06",
        dtrCount: 27,
        consumerCount: 4389,
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};

export const sampleMeterCommunicationSuccess = {
  success: true as const,
  data: {
    columns: [{ key: "meterSerialNumber", header: "Meter Serial" }],
    rows: [
      {
        slNo: 1,
        meterSerialNumber: "00000002",
        communicationStatus: "non-communicating",
        lastCommunication: null,
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};

/** Generic list fixture (DQ / scaffold). */
export const sampleMasterDataSuccess = {
  success: true as const,
  data: {
    items: [{ id: 1, name: "Sample" }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};
