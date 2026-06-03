// Mapper/eventclassification.mapper.ts
export interface EventClassificationResponse {
  success: boolean;
  data: EventClassificationData;
}
export interface EventClassificationData {
  items: EventClassificationItem[];
}
export interface EventClassificationItem {
  EventClassificationTblRefId: number;
  EventClassification_Name: string;
}
export class EventClassificationMapper {
  static mapData(data: EventClassificationData): EventClassificationData {
    return {
      items: data.items ?? [],
    };
  }
}
