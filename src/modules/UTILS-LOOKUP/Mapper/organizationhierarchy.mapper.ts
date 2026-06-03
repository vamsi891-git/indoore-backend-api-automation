export interface OrganisationResponse {
  success: boolean;
  data: OrganisationData;
}
export interface OrganisationData {
  items: OrganisationItem[];
}
export interface OrganisationItem {
  id: number;
  code: string;
  name: string;
  order: number;
}

export class OrganisationMapper {
  static mapData(data: OrganisationData): OrganisationData {
    return {
      items: data.items ?? [],
    };
  }
}
