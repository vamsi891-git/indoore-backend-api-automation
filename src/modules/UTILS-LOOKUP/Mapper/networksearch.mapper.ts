// Mapper/networksearch.mapper.ts
export interface NetworkSearchResponse {
  success: boolean;
  data: NetworkData;
}
export interface NetworkData {
  items: NetworkItem[];
}
export interface NetworkItem {
  id: number;
  name: string;
  code: string;
}
export class NetworkSearchMapper {
  static mapData(data: NetworkData): NetworkData {
    return {
      items: data.items ?? [],
    };
  }
}
