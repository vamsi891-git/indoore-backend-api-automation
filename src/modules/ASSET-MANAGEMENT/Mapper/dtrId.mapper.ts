export interface DtrDetailResponse{
    success:boolean;
    data:DtrDetailData;
    }
    export interface DtrDetailData{
    dtrCode:string;
    dtrName:string;
    dtrMeter:DtrMeter | null;
    consumers:ConsumerNode[];
    total:number;
    page:number;
    limit:number;
    totalPages:number;
    }
    export interface ConsumerNode{
    consumerTblRefId:number;
    consumerCid:string;
    consumerName:string;
    consumerAddress:string;
    accountId:string;
    rrNumber:string;
    meters:
    MeterNode[];
    }
    export interface MeterNode{
    meterLookupId:number;
    meterSerialNumber:string;
    latitude:string|null;
    longitude:string|null;
    }
    export interface DtrMeter{
    meterLookupId:number;
    meterSerialNumber:string;
    latitude:string|null;
    longitude:string|null;
    }
    export class DtrDetailMapper{
    static mapData(data:DtrDetailData):DtrDetailData{
    return{
    dtrCode:data.dtrCode ?? "",
    dtrName:data.dtrName ?? "",
    dtrMeter:data.dtrMeter ?? null,
    consumers:data.consumers ?? [],
    total:data.total ?? 0,
    page:data.page ?? 1,
    limit:data.limit ?? 20,
    totalPages:data.totalPages ?? 0
    }
}
    }