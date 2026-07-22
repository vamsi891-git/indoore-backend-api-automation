import type { DtrSearchData } from "../../../Mapper/dtrsearch.mapper";

export const sampleDtrItem = {
  slNo: 1,
  circle: "INDORE",
  division: "CITY",
  zone: "ZONE",
  subStation: "SS",
  feeder: "F1",
  code: "DTR1",
  dtrCode: "DTR1",
  dtrName: "DTR One",
  dtr: "DTR1",
  meterSerialNumber: "MSN1",
  mf: "1",
  latitude: "0",
  longitude: "0",
  serviceDate: null,
};

export const sampleDtrSearchData: DtrSearchData = {
  item: Array.from({ length: 10 }, (_, index) => ({
    ...sampleDtrItem,
    slNo: index + 1,
    dtrCode: `DTR${index + 1}`,
    code: `DTR${index + 1}`,
  })),
  total: 25,
  page: 1,
  limit: 10,
  totalPages: 3,
};

export const sampleDtrSearchSuccess = {
  success: true as const,
  data: {
    item: [sampleDtrItem],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};
