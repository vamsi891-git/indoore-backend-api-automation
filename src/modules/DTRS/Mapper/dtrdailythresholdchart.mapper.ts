export interface ThresholdPoint {
    month: number;
    monthLabel: string;
    activePower: number | null;
    reactivePower: number | null;
    apparentPower: number | null;
    powerFactor: number | null;
}

export interface DtrDailyThresholdChartDataModel {
    year: number;
    points: ThresholdPoint[];
}

export interface DtrDailyThresholdChartResponse {
    success: boolean;
    data: DtrDailyThresholdChartDataModel;
}

export class DtrDailyThresholdChartMapper {
    static map(response: DtrDailyThresholdChartResponse) {
        return {
            year: response.data.year,
            points: response.data.points
        };
    }
}