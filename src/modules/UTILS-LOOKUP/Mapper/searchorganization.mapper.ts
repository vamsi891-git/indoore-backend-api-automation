// Mapper/organisationsearch.mapper.ts
export interface OrganizationResponse {
  success: boolean;
  data: OrganizationData;
}
export interface OrganizationData {
  items: OrganizationItem[];
}
export interface OrganizationItem {
  id: number;
  name: string;
  code: string;
}
export class OrganizationMapper {
  static mapData(data: OrganizationData): OrganizationData {
    return {
      items: data.items ?? [],
    };
  }
}
