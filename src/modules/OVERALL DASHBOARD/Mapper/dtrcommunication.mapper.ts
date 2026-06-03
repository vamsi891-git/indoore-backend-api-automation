export interface TrendRow{
    label:string;
    communicatingMeters:number;
    nonCommunicatingMeters:number;
}
export interface MeterRow{
    meterId:number;
    lastseen:string|null;
    communicating:boolean;
    status:string;
}
export interface Pagination {
    page:number;
    pageSize:number;
    totalCount:number;
    totalPages:number;
}
export interface RawDtrCommunicationData {
    totalActiveDtrMeters:number;
    communicatingMeters:number;
    nonCommunicatingMeters:number;
    day:TrendRow[];
    month :TrendRow[];
    rows:MeterRow[];
    pagination:Pagination;
}
export interface dtrCommunicationResponse {
    success:boolean;
    data:RawDtrCommunicationData;
    message:string
}
export class DtrCommunicationMapper{
    static mapData(data:RawDtrCommunicationData){
        return {
            ...data,
            totalActiveDtrMeters:Number(data.totalActiveDtrMeters),
            communicatingMeters:Number(data.communicatingMeters),
            nonCommunicatingMeters:Number(data.nonCommunicatingMeters),
        };
    }
}