export interface BillingDataResponse {
    success: boolean;
    data: BillingData;
}

export interface BillingData {
    month: number;
    year: number;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    items: BillingItem[];
}

export interface BillingItem {
    slNo: number;
    circle: string | null;
    division: string | null;
    zone: string | null;
    substation: string | null;
    feeder: string | null;
    dtr: string | null;
    sanctionedLoadKw: number | null;
    consumerName: string | null;
    consumerAddress: string | null;
    ivrsNumber: string | null;
    tariff: string | null;
    meterNumber: string;
    phase: string;
    mf: number;
    billingDate: string;
    entryDateTime: string;
    pf: number;
    kwhC: number;
    kwhT1: number;
    kwhT2: number;
    kwhT3: number;
    kwhT4: number;
    kvahC: number;
    kvahT1: number;
    kvahT2: number;
    kvahT3: number;
    kvahT4: number;
    mdKw: number;
    mdKwOt: string;
    mdKva: number;
    mdKvaOt: string;
    billOnMin: number;
    kwhExpC: number;
    kvahExpC: number;
}

export class BillingDataMapper {
    static mapData(data: BillingData): BillingData {
        return {
            month: data.month ?? 0,
            year: data.year ?? 0,
            page: data.page ?? 1,
            limit: data.limit ?? 10,
            total: data.total ?? 0,
            totalPages: data.totalPages ?? 0,
            items: data.items ?? []
        };
    }
}