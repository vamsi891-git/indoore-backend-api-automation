export type HierarchyTypeItem = {
  id: number;
  code: string;
  name: string;
  order: number;
  type: string;
  label: string;
  filterable: boolean;
};

export type HierarchyTypesData = {
  items: HierarchyTypeItem[];
};

export type HierarchyTypesResponse = {
  success: boolean;
  data: HierarchyTypesData;
};

export class HierarchyTypesMapper {
  static mapData(
    data: HierarchyTypesData | null | undefined,
  ): HierarchyTypesData {
    return {
      items: data?.items ?? [],
    };
  }
}
