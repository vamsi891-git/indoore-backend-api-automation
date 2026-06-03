// Mapper/devicemanufacturer.mapper.ts
export interface DeviceManufacturerResponse {
  success: boolean;
  data: DeviceManufacturerData;
}
export interface DeviceManufacturerData {
  items: DeviceManufacturerItem[];
}
export interface DeviceManufacturerItem {
  id: number;
  name: string;
  code: string | null;
}
export class DeviceManufacturerMapper {
  static mapData(data: DeviceManufacturerData): DeviceManufacturerData {
    return {
      items: data.items ?? [],
    };
  }
}
