// Mapper/connectionstatus.mapper.ts
export interface ConnectionStatusResponse {
  success: boolean;
  data: ConnectionStatusData;
}
export interface ConnectionStatusData {
  items: ConnectionStatusItem[];
}
export interface ConnectionStatusItem {
  id: number;
  name: string;
  shortName: string | null;
}
export class ConnectionStatusMapper {
  static mapData(data: ConnectionStatusData): ConnectionStatusData {
    return {
      items: data.items ?? [],
    };
  }
}
