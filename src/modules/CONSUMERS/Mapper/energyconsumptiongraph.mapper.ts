export interface GraphPoint {
    label: string;
    consumptionKwh: number | null;
}

export interface EnergyConsumptionGraphResponse {
    success: boolean;
    data?: {
        period: string;
        points: GraphPoint[];
    };
}

const EMPTY_GRAPH_DATA = { period: "", points: [] as GraphPoint[] };

export class EnergyConsumptionGraphMapper {
    static map(response: EnergyConsumptionGraphResponse) {
        const data = response.data ?? EMPTY_GRAPH_DATA;
        return {
            success: response.success,
            period: data.period ?? "",
            points: data.points ?? [],
        };
    }
}
