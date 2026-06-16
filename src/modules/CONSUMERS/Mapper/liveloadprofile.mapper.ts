export interface PowerMetric {
    title: string;
    value: number | null;
    unit: string;
    sharePercent?: number | null;
}
export interface PowerFactor {
    title: string;
    value: number | null;
    unit: string;
}
export interface LiveLoadProfileData {
    lastReadingIso?: string | null;
    meterPhase?: "SP" | "TP" | null;
    activePower?: PowerMetric;
    apparentPower?: PowerMetric;
    reactivePower?: PowerMetric;
    powerFactor?: PowerFactor;
    kw?: PowerMetric;
    kva?: PowerMetric;
    kvar?: PowerMetric;
}
export interface LiveLoadProfileResponse {
    success: boolean;
    data?: LiveLoadProfileData;
}
const EMPTY_LIVE_LOAD_DATA: LiveLoadProfileData = {};

export class LiveLoadProfileMapper {
    static map(response:LiveLoadProfileResponse) {
        const data = response.data ?? EMPTY_LIVE_LOAD_DATA;
        const metric = (input: any, title: string, unit: string) => ({
            title: input?.title ?? title,
            value: input?.value ?? null,
            unit: input?.unit ?? unit,
            sharePercent: input?.sharePercent ?? null
        });
        return {
            success:response.success,
            lastReadingIso:data.lastReadingIso ?? null,
            meterPhase:data.meterPhase ?? null,
            activePower:metric(data.activePower ?? data.kw, "Active Power", "kW"),
            apparentPower:metric(data.apparentPower ?? data.kva, "Apparent Power", "kVA"),
            reactivePower:metric(data.reactivePower ?? data.kvar, "Reactive Power", "kVAr"),
            powerFactor:{
                title:data.powerFactor?.title ?? "Power Factor",
                value:data.powerFactor?.value ?? null,
                unit:data.powerFactor?.unit ?? "Power Factor"
            }
        };
    }
}