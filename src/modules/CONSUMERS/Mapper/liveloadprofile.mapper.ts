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
export interface LiveLoadProfileResponse {
    success: boolean;
    data: {
        lastReadingIso:string | null;
        meterPhase:"SP" | "TP" | null;
        activePower:PowerMetric;
        apparentPower:PowerMetric;
        reactivePower:PowerMetric;
        powerFactor:PowerFactor;
    }
}
export class LiveLoadProfileMapper {
    static map(response:LiveLoadProfileResponse) {
        return {
            success:response.success,
            lastReadingIso:response.data.lastReadingIso,
            meterPhase:response.data.meterPhase,
            activePower:response.data.activePower,
            apparentPower:response.data.apparentPower,
            reactivePower:response.data.reactivePower,
            powerFactor:response.data.powerFactor
        };
    }
}