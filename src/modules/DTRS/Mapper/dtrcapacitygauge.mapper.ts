import { gaugePercent, roundGauge } from "../utils/dtr-backend.util";

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
    data?: CapacityGaugeData;
}

const EMPTY_BANDS: CapacityBand[] = [
    { label: "Instant", value: 0, percent: 0, unit: "KVA" },
    { label: "Daily", value: 0, percent: 0, unit: "MDkVA" },
    { label: "Monthly", value: 0, percent: 0, unit: "MDkVA" },
    { label: "Yearly", value: 0, percent: 0, unit: "MDkVA" },
    { label: "LifeTime", value: 0, percent: 0, unit: "MDkVA" },
];

export class DtrCapacityGaugeMapper {
    static map(response: DtrCapacityGaugeResponse) {
        const data = response.data;
        const ratedCapacityKva = data?.ratedCapacityKva ?? null;
        const cap =
            ratedCapacityKva != null && ratedCapacityKva > 0
                ? ratedCapacityKva
                : null;

        const rawBands = data?.bands?.length ? data.bands : EMPTY_BANDS;
        const bands = rawBands.map((band) => {
            const value = roundGauge(band.value as number | null);
            return {
                label: band.label,
                value,
                percent: gaugePercent(value, cap),
                unit: band.unit,
            };
        });

        return {
            ratedCapacityKva,
            bands,
        };
    }
}
