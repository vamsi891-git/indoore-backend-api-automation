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
