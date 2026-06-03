export interface EventRestorationRow {
    address: any;
    slNo:number;
    circle:string;
    division:string;
    zone:string;
    subStation:string;
    feeder:string;
    dtr:string;
    name:string;
    ivrsNumber:string;
    tariff:string;
    msn:string;
    phase:string;
    eventClassificationName:string;
    eventName:string;
    occurrenceTime:string;
}
export interface EventRestorationData {
    fromDate:string;
    toDate:string;
    limit:number;
    scopedMeterCount:number;
    truncated:boolean;
    rows:EventRestorationRow[];
}
export interface EventRestorationResponse {
    success:boolean;
    data:EventRestorationData;
}
export function mapEventRestorationResponse(response:EventRestorationResponse):EventRestorationRow[]{
    return response.data.rows.map((row)=>({
        slNo:Number(row.slNo),
        circle:row.circle?.trim(),
        division:row.division?.trim(),
        zone:row.zone?.trim(),
        subStation:row.subStation?.trim(),
        feeder:row.feeder?.trim(),
        dtr:row.dtr?.trim(),
        name:row.name?.trim(),
        address:row.address?.trim(),
        ivrsNumber:row.ivrsNumber?.trim(),
        tariff:row.tariff?.trim(),
        msn:row.msn?.trim(),
        phase:row.phase?.trim(),
        eventClassificationName:row.eventClassificationName?.trim(),
        eventName:row.eventName?.trim(),
        occurrenceTime:row.occurrenceTime?.trim(),

    }));
}
