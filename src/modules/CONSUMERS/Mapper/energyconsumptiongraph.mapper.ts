export interface GraphPoint {
    label: string;
    consumptionKwh:number | null;
}
export interface GraphGroup {
    title: string;
    points: GraphPoint[];
}
export interface EnergyConsumptionGraphResponse {
    success: boolean;
    data: {
        weekly: GraphGroup;
        monthly: GraphGroup;
        yearly: GraphGroup;
    }
}
export class EnergyConsumptionGraphMapper {
    static map(response:EnergyConsumptionGraphResponse) {
        return {
            success: response.success,
            weekly: response.data.weekly,
            monthly: response.data.monthly,
            yearly: response.data.yearly
        };
    }
}