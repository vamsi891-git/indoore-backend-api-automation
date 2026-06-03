export interface CapacityBand {
    label: string;
    value: number;
    percent: number;
    unit: string;
}
export interface CapacityGaugeData {
    ratedCapacityKva: number | null;
    bands: CapacityBand[];
}

export interface DtrCapacityGaugeResponse {
    success: boolean;
    data: CapacityGaugeData;
}
export class DtrCapacityGaugeMapper {
    static map(response: DtrCapacityGaugeResponse) {
        return {
            ratedCapacityKva:response.data.ratedCapacityKva,
            bands:response.data.bands
        };
    }
}