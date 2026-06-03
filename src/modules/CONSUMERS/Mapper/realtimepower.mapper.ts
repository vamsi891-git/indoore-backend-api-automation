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
    data: {
        "R-Phase": Phase | null;
        "Y-Phase": Phase | null;
        "B-Phase": Phase | null;
    }
}

export class RealTimePowerMapper {
    static map(response: RealTimePowerResponse) {
        return {
            success:response.success,
            rPhase:response.data["R-Phase"],
            yPhase:response.data["Y-Phase"],
            bPhase:response.data["B-Phase"]
        };
    }
}