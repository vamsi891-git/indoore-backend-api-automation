export interface MeterLocationData {
  nodeId: string;
  latitude: number;
  longitude: number;
  hesResponse: string;
}

export interface MeterLocationResponse {
  success: boolean;
  data?: MeterLocationData;
  error?: { code?: string; message?: string };
}

export interface MappedMeterLocationData {
  location: MeterLocationData;
}

export class CommandsMeterLocationMapper {
  static mapResponse(body: MeterLocationResponse): MappedMeterLocationData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful meter-location response");
    }

    const { data } = body;
    return {
      location: {
        nodeId: data.nodeId.trim(),
        latitude: data.latitude,
        longitude: data.longitude,
        hesResponse: data.hesResponse.trim(),
      },
    };
  }
}
