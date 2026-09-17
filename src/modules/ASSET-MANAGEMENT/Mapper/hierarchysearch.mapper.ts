import type { HierarchyExplorerNode } from "./hierarchychildren.mapper";

export type HierarchyExplorerAncestor = {
  id: number;
  type: string;
  code: string;
  name: string;
};

export type HierarchySearchItem = {
  node: HierarchyExplorerNode;
  ancestors: HierarchyExplorerAncestor[];
};

export type HierarchySearchData = {
  items: HierarchySearchItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type HierarchySearchResponse = {
  success: boolean;
  data: HierarchySearchData;
};

export class HierarchySearchMapper {
  static mapData(
    data: HierarchySearchData | null | undefined,
  ): HierarchySearchData {
    return {
      items: data?.items ?? [],
      page: data?.page ?? 1,
      pageSize: data?.pageSize ?? 20,
      total: data?.total ?? 0,
      totalPages: data?.totalPages ?? 0,
    };
  }
}
