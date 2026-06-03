// Mapper/consumercategory.mapper.ts
export interface ConsumerCategoryResponse {
  success: boolean;
  data: ConsumerCategoryData;
}
export interface ConsumerCategoryData {
  items: ConsumerCategoryItem[];
}
export interface ConsumerCategoryItem {
  id: number;
  shortName: string;
  name: string;
}
export class ConsumerCategoryMapper {
  static mapData(data: ConsumerCategoryData): ConsumerCategoryData {
    return {
      items: data.items ?? [],
    };
  }
}
