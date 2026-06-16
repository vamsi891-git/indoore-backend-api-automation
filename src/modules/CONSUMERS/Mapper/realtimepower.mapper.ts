export interface Phase {
    voltage: number | null;
    voltageUnit: string;
    current: number | null;
    currentUnit: string;
    powerFactor: number | null;
    powerFactorUnit: string;
}
export interface RealTimePowerResponse {
    success: boolean;
    data?: {
        "R-Phase": Phase | null;
        "Y-Phase": Phase | null;
        "B-Phase": Phase | null;
    }
}

const EMPTY_REALTIME_POWER_DATA = {
    "R-Phase": null,
    "Y-Phase": null,
    "B-Phase": null,
} satisfies RealTimePowerResponse["data"];

export class RealTimePowerMapper {
    static map(response: RealTimePowerResponse) {
        const data = response.data ?? EMPTY_REALTIME_POWER_DATA;
        return {
            success:response.success,
            rPhase:data["R-Phase"],
            yPhase:data["Y-Phase"],
            bPhase:data["B-Phase"]
        };
    }
}