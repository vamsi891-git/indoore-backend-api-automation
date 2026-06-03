export interface DtrConsumptionResponse {
    success: boolean;
    message: string;
    data: {
        period: string;
        points: {
            label: string;
            kwh: number;
            kvah: number;
            kvarh: number;
        }[];
    };
}

export interface ConsumptionPoint {
    label: string;
    kwh: number;
    kvah: number;
    kvarh: number;
}

export interface DtrConsumptionModel {
    period: string;
    points: ConsumptionPoint[];
}

export class DtrConsumptionMapper {

    static mapData(
        response: DtrConsumptionResponse
    ): DtrConsumptionModel {

        return {
            period: response.data.period,

            points: (response.data.points ?? []).map(point => ({
                label: point.label,
                kwh: Number(point.kwh ?? 0),
                kvah: Number(point.kvah ?? 0),
                kvarh: Number(point.kvarh ?? 0)
            }))
        };
    }
}