// Mapper/event.mapper.ts
export interface EventResponse {
  success: boolean;
  data: EventData;
}
export interface EventData {
  items: EventItem[];
}
export interface EventItem {
  id: number;
  code: number | null;
  name: string;
  description: string;
  eventReferenceTable: string | null;
}
export class EventMapper {
  static mapData(data: EventData): EventData {
    return {
      items: data.items ?? [],
    };
  }
}
