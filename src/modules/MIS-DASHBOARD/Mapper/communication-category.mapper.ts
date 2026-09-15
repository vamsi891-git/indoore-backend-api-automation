export interface CommunicationCategoryItem {
  label: string;
  count: number;
  percentage: string;
}

export interface CommunicationCategoryData {
  fromDate: string;
  toDate: string;
  categories: CommunicationCategoryItem[];
}

export interface CommunicationCategoryResponse {
  success: boolean;
  data: CommunicationCategoryData;
}

export class CommunicationCategoryMapper {
  static map(data: any): CommunicationCategoryData {
    return {
      fromDate: data?.fromDate ?? "",
      toDate: data?.toDate ?? "",
      categories: data?.categories ?? [],
    };
  }
}
