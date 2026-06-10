export interface DtrCommunicationPoint {
  label: string;
  communicatingMeters: number;
  nonCommunicatingMeters: number;
}

export interface DtrCommunicationModel {
  period: string;
  points: DtrCommunicationPoint[];
}

export interface dtrCommunicationResponse {
  success: boolean;
  data: {
    period: string;
    points: Array<{
      label: string;
      communicating: number;
      nonCommunicating: number;
    }>;
  };
  message: string;
}

export class DtrCommunicationMapper {
  static mapData(response: dtrCommunicationResponse): DtrCommunicationModel {
    return {
      period: response.data?.period ?? "",
      points: (response.data?.points ?? []).map((point) => ({
        label: point.label,
        communicatingMeters: Number(point.communicating ?? 0),
        nonCommunicatingMeters: Number(point.nonCommunicating ?? 0),
      })),
    };
  }
}
