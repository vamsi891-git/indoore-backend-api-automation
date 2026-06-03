// Mapper/eventpriority.mapper.ts
export interface EventPriorityResponse {
  success: boolean;
  data: EventPriorityData;
}
export interface EventPriorityData {
  items: EventPriorityItem[];
}
export interface EventPriorityItem {
  priorityTblRefId: number;
}
export class EventPriorityMapper {
  static mapData(data: EventPriorityData): EventPriorityData {
    return {
      items: data.items ?? [],
    };
  }
}
