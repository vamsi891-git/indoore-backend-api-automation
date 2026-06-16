export interface EnergyFlowPoint {
    label: string;
    kwhImport: number;
    kvahImport: number;
    kwhExport: number;
    kvahExport: number;
}

export interface EnergyFlowResponse {
    success: boolean;
    data?: {
        period: string;
        points: EnergyFlowPoint[];
    };
}

const EMPTY_FLOW_DATA = { period: "", points: [] as EnergyFlowPoint[] };

export class EnergyFlowMapper {
    static map(response: EnergyFlowResponse) {
        const data = response.data ?? EMPTY_FLOW_DATA;
        return {
            success: response.success,
            period: data.period ?? "",
            points: data.points ?? [],
        };
    }
}
