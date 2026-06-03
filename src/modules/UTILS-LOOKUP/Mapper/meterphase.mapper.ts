// Mapper/meterphase.mapper.ts
export interface MeterPhaseResponse {
  success: boolean;
  data: MeterPhaseData;
}
export interface MeterPhaseData {
  items: MeterPhaseItem[];
}
export interface MeterPhaseItem {
  id: number;
  name: string;
}
export class MeterPhaseMapper {
  static mapData(data: MeterPhaseData): MeterPhaseData {
    return {
      items: data.items ?? [],
    };
  }
}
