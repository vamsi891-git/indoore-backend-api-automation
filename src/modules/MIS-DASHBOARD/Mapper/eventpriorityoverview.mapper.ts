export interface DayCompare {
    currentDay: number;
    previousDay: number;
}
export interface Priority {
    priorityId: number;
    label: string;
    currentDay: number;
    previousDay: number;
}
export interface EventPriorityOverviewData {
    currentDate: string;
    previousDate: string;
    totalEventsCurrentDay: number;
    totalEventsPreviousDay: number;
    active: DayCompare;
    resolve: DayCompare;
    priorities: Priority[];
}
export interface EventPriorityOverviewResponse {
    success: boolean;
    data: EventPriorityOverviewData;
}
export class EventPriorityOverviewMapper {
    static map(data: any): EventPriorityOverviewData {
        return {
            currentDate:data?.currentDate ?? "",
            previousDate:data?.previousDate ?? "",
            totalEventsCurrentDay:Number(data?.totalEventsCurrentDay) || 0,
            totalEventsPreviousDay:Number(data?.totalEventsPreviousDay) || 0,
            active: {
                currentDay:Number(data?.active?.currentDay) || 0,
                previousDay:Number(data?.active?.previousDay) || 0
            },
            resolve: {
                currentDay:Number(data?.resolve?.currentDay) || 0,
                previousDay:Number(data?.resolve?.previousDay) || 0
            },
            priorities:data?.priorities?.map((x: any) => ({priorityId:Number(x.priorityId) || 0,
                        label:x.label,
                        currentDay:Number(x.currentDay) || 0,
                        previousDay:Number(x.previousDay) || 0
                    })
                )
                ?? []
        };
    }
}