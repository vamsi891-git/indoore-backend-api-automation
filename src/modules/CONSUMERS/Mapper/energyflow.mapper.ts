export interface EnergyFlowPoint {
    label: string;
    date: string;
    kwhImport: number;
    kvahImport: number;
    kwhExport: number;
    kvahExport: number;
}

export interface EnergyFlowResponse {
    success: boolean;
    data: {
        title: string;
        subtitle: string;
        source: string;
        points:EnergyFlowPoint[];
    }
}
export class EnergyFlowMapper {
    static map(response:EnergyFlowResponse) {
        return {
            success:response.success,
            title:response.data.title,
            subtitle:response.data.subtitle,
            source:response.data.source,
            points:response.data.points
        };
    }
}