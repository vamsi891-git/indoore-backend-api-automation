import type { SearchConsumerData } from "../../../Mapper/consumersearch.mapper";

export const sampleConsumerItem = {
  id: "c-1",
  slNo: 1,
  consumerName: "Sample",
  consumerCid: "CID-1",
  consumerAddress: "Address",
  ivrsNo: "123",
  existingIvrsNo: "123",
  meterSerialNumber: "MSN-1",
  consumerMobileNumber: "9999999999",
};

export const sampleConsumerSearchData: SearchConsumerData = {
  items: Array.from({ length: 10 }, (_, index) => ({
    ...sampleConsumerItem,
    id: `c-${index + 1}`,
    slNo: index + 1,
  })),
  total: 25,
  page: 1,
  limit: 10,
  totalPages: 3,
};

export const sampleConsumerSearchSuccess = {
  success: true as const,
  data: {
    items: [sampleConsumerItem],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};
