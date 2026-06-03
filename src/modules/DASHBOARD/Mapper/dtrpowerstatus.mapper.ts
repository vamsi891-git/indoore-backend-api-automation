export interface DtrPowerStatusResponse {
    success: boolean;
    data: {
        period: string;
        points: PowerPoint[];
    };
    message: string;
}

export interface PowerPoint {
    label: string;
    dtrsOn: number;
    dtrsOff: number;
    onPercentage: number;
    offPercentage: number;
}

export interface DtrPowerStatusModel {
    period: string;
    points: PowerPoint[];
}

export class DtrPowerStatusMapper {
    static mapData(
        response: DtrPowerStatusResponse
    ): DtrPowerStatusModel {

        return {
            period: response.data?.period ?? "",
            points: (response.data?.points ?? []).map(point => ({
                label: point.label,
                dtrsOn: Number(point.dtrsOn ?? 0),
                dtrsOff: Number(point.dtrsOff ?? 0),
                onPercentage: Number(point.onPercentage ?? 0),
                offPercentage: Number(point.offPercentage ?? 0)
            }))
        };
    }
}