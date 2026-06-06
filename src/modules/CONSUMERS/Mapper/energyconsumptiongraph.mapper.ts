export interface GraphPoint {
    label: string;
    consumptionKwh: number | null;
}

export interface EnergyConsumptionGraphResponse {
    success: boolean;
    data: {
        period: string;
        points: GraphPoint[];
    };
}

export class EnergyConsumptionGraphMapper {
    static map(response: EnergyConsumptionGraphResponse) {
        return {
            success: response.success,
            period: response.data.period,
            points: response.data.points ?? [],
        };
    }
}
