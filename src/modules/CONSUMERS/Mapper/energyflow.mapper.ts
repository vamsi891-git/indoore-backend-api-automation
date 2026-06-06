export interface EnergyFlowPoint {
    label: string;
    kwhImport: number;
    kvahImport: number;
    kwhExport: number;
    kvahExport: number;
}

export interface EnergyFlowResponse {
    success: boolean;
    data: {
        period: string;
        points: EnergyFlowPoint[];
    };
}

export class EnergyFlowMapper {
    static map(response: EnergyFlowResponse) {
        return {
            success: response.success,
            period: response.data.period,
            points: response.data.points ?? [],
        };
    }
}
