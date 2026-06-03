export interface DtrCommunicationResponse {
    success: boolean;
    data: {
        period: string;
        points: {
            label: string;
            communicating: number;
            nonCommunicating: number;
        }[];
    };
    message: string;
}

export interface DtrCommunicationPoint {
    label: string;
    communicatingMeters: number;
    nonCommunicatingMeters: number;
}

export interface DtrCommunicationModel {
    period: string;
    points: DtrCommunicationPoint[];
}

export class DtrCommunicationMapper {
    static mapdata(
        response: DtrCommunicationResponse
    ): DtrCommunicationModel {

        return {
            period: response.data.period,

            points: (response.data.points ?? []).map(point => ({
                label: point.label,
                communicatingMeters: Number(point.communicating ?? 0),
                nonCommunicatingMeters: Number(point.nonCommunicating ?? 0)
            }))
        };
    }
}