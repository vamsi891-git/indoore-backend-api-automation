import { HierarchyChildrenSuccessResponseSchema } from "../schemas/asset-management.schemas";

export { HierarchyChildrenSuccessResponseSchema };

export type HierarchyExplorerNode = {
  id: number;
  type: string;
  code: string;
  name: string;
  displayName: string;
  parentId: number | null;
  hasChildren: boolean;
  childCount: number;
  consumerCount: number | null;
  meterCount: number | null;
  status: string;
  isDtr: boolean;
};

export type HierarchyChildrenData = {
  items: HierarchyExplorerNode[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type HierarchyChildrenResponse = {
  success: boolean;
  data: HierarchyChildrenData;
};

export class HierarchyChildrenMapper {
  static mapData(
    data: HierarchyChildrenData | null | undefined,
  ): HierarchyChildrenData {
    return {
      items: data?.items ?? [],
      page: data?.page ?? 1,
      pageSize: data?.pageSize ?? 20,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
    };
  }
}
