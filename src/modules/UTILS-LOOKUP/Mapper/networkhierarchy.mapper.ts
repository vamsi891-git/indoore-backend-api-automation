export interface NetworkResponse {
  success: boolean;
  data: NetworkData;
}
export interface NetworkData {
  items: NetworkItem[];
}
export interface NetworkItem {
  id: number;
  code: string;
  name: string;
  order: number;
}

export class NetworkMapper {
  static mapData(data: NetworkData): NetworkData {
    return {
      items: data.items ?? [],
    };
  }
}
