export interface SearchConsumerResponse {
    success: boolean;
    data: SearchConsumerData;
}

export interface SearchConsumerData {
    items: ConsumerItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ConsumerItem {
    slNo: number;

    division: string | null;
    zone: string | null;
    feeder: string | null;
    dtr: string | null;

    feederNameNew: string | null;
    dtrNameNew: string | null;

    consumerCid: string;
    consumerName: string;
    consumerAddress: string;
    consumerMobileNumber: string;

    category: string;
    sanctionedLoadKw: number;

    ivrsNo: string;
    existingIvrsNo: string;

    meterSerialNumber: string;
    meterPhase: string;

    mf: number;

    installationDate: string;

    latitude: string | null;
    longitude: string | null;

    meterLookupTblRefId: number;

    lsCount: number | null;
    dpCount: number | null;
}

export class SearchConsumerMapper {
    static mapData(
        data: SearchConsumerData
    ): SearchConsumerData {
        return {
            items: data.items ?? [],
            total: data.total,
            page: data.page,
            limit: data.limit,
            totalPages: data.totalPages,
        };
    }
}