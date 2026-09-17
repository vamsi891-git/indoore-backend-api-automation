/** Static fixtures for Asset Management mutation proofs (no live API). */

export const sampleNetworkHierarchySuccess = {
  success: true as const,
  data: {
    hierarchy: [
      {
        networkLookupId: 1,
        networkCode: "SS-01",
        networkName: "Sub Station A",
        hierarchyLevel: "Sub Station",
        children: [
          {
            networkLookupId: 2,
            networkCode: "FD-01",
            networkName: "Feeder A",
            hierarchyLevel: "Feeder",
            children: [],
            dtrs: [
              {
                networkLookupId: 10,
                dtrCode: "DTR-10",
                dtrName: "DTR Ten",
                consumerCount: 2,
                dtrMeter: {
                  meterLookupId: 100,
                  meterSerialNumber: "MSN-100",
                  latitude: "22.7",
                  longitude: "75.8",
                },
              },
            ],
          },
        ],
        dtrs: [],
      },
    ],
  },
};

export const sampleOrganisationHierarchySuccess = {
  success: true as const,
  data: {
    hierarchy: [
      {
        organisationLookupId: 1,
        officeCode: "DISCOM",
        officeName: "Discom HQ",
        hierarchyLevel: "Discom",
        children: [
          {
            organisationLookupId: 2,
            officeCode: "REG",
            officeName: "Region 1",
            hierarchyLevel: "Region",
            children: [
              {
                organisationLookupId: 3,
                officeCode: "CIR",
                officeName: "Circle 1",
                hierarchyLevel: "Circle",
                children: [
                  {
                    organisationLookupId: 4,
                    officeCode: "DIV",
                    officeName: "Division 1",
                    hierarchyLevel: "Division",
                    children: [
                      {
                        organisationLookupId: 5,
                        officeCode: "ZONE",
                        officeName: "Zone 1",
                        hierarchyLevel: "Zone",
                        children: [],
                        dtrs: [
                          {
                            networkLookupId: 10,
                            dtrCode: "DTR-10",
                            dtrName: "DTR Ten",
                            consumerCount: 1,
                            dtrMeter: null,
                          },
                        ],
                      },
                    ],
                    dtrs: [],
                  },
                ],
                dtrs: [],
              },
            ],
            dtrs: [],
          },
        ],
        dtrs: [],
      },
    ],
  },
};

export const sampleDtrDetailSuccess = {
  success: true as const,
  data: {
    dtrCode: "DTR-10",
    dtrName: "DTR Ten",
    dtrMeter: {
      meterLookupId: 100,
      meterSerialNumber: "MSN-100",
      latitude: "22.7",
      longitude: "75.8",
    },
    consumers: [
      {
        consumerTblRefId: 501,
        consumerCid: "CID-501",
        consumerName: "Consumer One",
        consumerAddress: "Address 1",
        accountId: "ACC-501",
        rrNumber: "RR-501",
        meters: [
          {
            meterLookupId: 201,
            meterSerialNumber: "MSN-201",
            latitude: null,
            longitude: null,
          },
        ],
      },
    ],
    page: 1,
    limit: 20,
    total: 25,
    totalPages: 2,
  },
};

export const sampleHierarchyChildrenSuccess = {
  success: true as const,
  data: {
    items: [
      {
        id: 820,
        type: "SUB_STATION",
        code: "SS06",
        name: "Airport Grid",
        displayName: "Airport Grid (SS06)",
        parentId: null,
        hasChildren: true,
        childCount: 1,
        consumerCount: null,
        meterCount: null,
        status: "UNKNOWN",
        isDtr: false,
      },
    ],
    page: 1,
    pageSize: 20,
    total: 26,
    totalPages: 2,
  },
};

export const sampleHierarchySearchSuccess = {
  success: true as const,
  data: {
    items: [
      {
        node: {
          id: 108,
          type: "ZONE",
          code: "",
          name: "HT-Indore",
          displayName: "HT-Indore",
          parentId: 58,
          hasChildren: false,
          childCount: 0,
          consumerCount: null,
          meterCount: null,
          status: "UNKNOWN",
          isDtr: false,
        },
        ancestors: [
          {
            id: 1,
            type: "DISCOM",
            code: "CITI1",
            name: "CITI1",
          },
          {
            id: 58,
            type: "DIVISION",
            code: "",
            name: "Indore",
          },
        ],
      },
    ],
    page: 1,
    pageSize: 20,
    total: 11,
    totalPages: 1,
  },
};

export const sampleHierarchyTypesSuccess = {
  success: true as const,
  data: {
    items: [
      {
        id: 1,
        code: "1",
        name: "Sub Station",
        order: 1,
        type: "SUB_STATION",
        label: "Sub Station",
        filterable: true,
      },
      {
        id: 2,
        code: "2",
        name: "Feeder",
        order: 2,
        type: "FEEDER",
        label: "Feeder",
        filterable: true,
      },
      {
        id: 3,
        code: "3",
        name: "DTR",
        order: 3,
        type: "DTR",
        label: "DTR",
        filterable: true,
      },
    ],
  },
};

export const sampleAssetDetailSuccess = {
  success: true as const,
  data: {
    id: 4,
    kind: "network" as const,
    type: "FEEDER",
    code: "RJ66",
    name: "PARMANU NAGAR(CHQ)",
    displayName: "PARMANU NAGAR(CHQ) (RJ66)",
    status: "UNKNOWN",
    hierarchyPath: [
      {
        id: 3,
        type: "SUB_STATION",
        code: "SS01",
        name: "PragatiNagar",
      },
    ],
    hierarchySummary: [
      {
        type: "SUB_STATION",
        label: "Sub Station",
        relationship: "ANCESTOR" as const,
        directCount: null,
        descendantCount: null,
      },
      {
        type: "FEEDER",
        label: "Feeder",
        relationship: "SELF" as const,
        directCount: null,
        descendantCount: null,
      },
      {
        type: "DTR",
        label: "DTR",
        relationship: "DESCENDANT" as const,
        directCount: 21,
        descendantCount: 21,
      },
    ],
    consumerCount: 12758,
    dtrCount: 21,
    meterCount: 13633,
    activeMeterCount: 13430,
    inactiveMeterCount: 203,
    faultyMeterCount: null,
    unknownMeterCount: 0,
    assetHealthPercentage: null,
    assetHealthAvailable: false,
    connectedSince: "2018-08-11T17:29:07.560Z",
    lastUpdatedAt: "2019-11-18T17:44:54.713Z",
    meterSummary: {
      total: 13633,
      active: 13430,
      inactive: 203,
      faulty: null,
      unknown: 0,
      available: true,
    },
    communicationSummary: {
      available: true,
      consumerOnline: 0,
      dtrOnline: 0,
      totalOnline: 0,
      consumerOffline: 12758,
      dtrOffline: 21,
      totalOffline: 12779,
    },
    recentActivity: {
      available: false,
      items: [],
      total: 0,
    },
  },
};

export const sampleAssetExportCsv = [
  "Hierarchy Type,Asset Code,Asset Name,Display Name,Parent Type,Parent Code,Parent Name,Consumer Count,Meter Count",
  "Sub Station,SS01,PragatiNagar,PragatiNagar (SS01),,,,,",
  "Feeder,RJ66,PARMANU NAGAR(CHQ),PARMANU NAGAR(CHQ) (RJ66),Sub Station,SS01,PragatiNagar,,",
  "DTR,DTR-10,DTR Ten,DTR Ten (DTR-10),Feeder,RJ66,PARMANU NAGAR(CHQ),12758,13633",
].join("\n");

export const sampleOrganisationExportCsv = [
  "Hierarchy Type,Office Code,Office Name,Display Name,Parent Type,Parent Code,Parent Name",
  "Discom,DISCOM1,Indore Discom,Indore Discom (DISCOM1),,,",
  "Region,REG01,Indore Region,Indore Region (REG01),Discom,DISCOM1,Indore Discom",
].join("\n");

export const sampleMapMarkersSuccess = {
  success: true as const,
  data: {
    markers: [
      {
        id: "meter-1095",
        kind: "consumer" as const,
        assetId: 1095,
        nodeId: 8,
        name: "M/S LAJWAN STEEL",
        code: "85080223",
        lat: 12.9357257,
        lng: 77.6155503,
      },
      {
        id: "dtr-10",
        kind: "dtr" as const,
        assetId: 10,
        nodeId: 821,
        name: "DTR Ten",
        code: "DTR-10",
        lat: 12.93,
        lng: 77.61,
      },
    ],
    count: 2,
    limit: 2000,
    truncated: true,
    consumerTotal: 141059,
    dtrTotal: 1201,
    consumerMappedTotal: 111513,
    dtrMappedTotal: 1057,
    onlineCount: 5,
    offlineCount: 142255,
  },
};
