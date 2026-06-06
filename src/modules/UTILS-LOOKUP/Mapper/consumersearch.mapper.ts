export interface SearchConsumerResponse {
    success: boolean;
    data: SearchConsumerRawData;
}

export interface SearchConsumerRawData {
    columns?: Array<{ key: string; header: string }>;
    rows?: ConsumerItem[];
    items?: ConsumerItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
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
    static mapData(data: SearchConsumerRawData): SearchConsumerData {
        const items = data.rows ?? data.items ?? [];
        const pagination = data.pagination;

        return {
            items,
            total: pagination?.total ?? data.total ?? items.length,
            page: pagination?.page ?? data.page ?? 1,
            limit: pagination?.limit ?? data.limit ?? 20,
            totalPages: pagination?.totalPages ?? data.totalPages ?? 1,
        };
    }
}
