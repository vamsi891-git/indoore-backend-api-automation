export type FeederConsumptionGranularity = "day" | "monthly";

export interface FeederConsumptionPoint {
    label: string;
    key: string;
    kwh: number | null;
}

export interface FeederDailyConsumptionData {
    granularity: FeederConsumptionGranularity;
    unit: string;
    points: FeederConsumptionPoint[];
}

export interface FeederDailyConsumptionResponse {
    success: boolean;
    data: FeederDailyConsumptionData;
}

export class FeederDailyConsumptionMapper {
    static map(
        response: FeederDailyConsumptionResponse,
    ): FeederDailyConsumptionData & { success: boolean } {
        const data = response.data ?? ({} as FeederDailyConsumptionData);
        return {
            success: response.success,
            granularity: data.granularity ?? "day",
            unit: data.unit ?? "kWh",
            points: data.points ?? [],
        };
    }
}
