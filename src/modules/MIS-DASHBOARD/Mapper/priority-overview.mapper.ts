export interface Priority {
    priorityId: number;
    priorityLabel: string;
    events: number;
}
export interface PriorityOverviewData {
    fromDate: string;
    toDate: string;
    priorities: Priority[];
}
export interface PriorityOverviewResponse {
    success: boolean;
    data: PriorityOverviewData;
}

export class PriorityOverviewMapper {
    static mapPriorityOverview(data: any): PriorityOverviewData {
        return {
            fromDate:data?.fromDate ?? "",
            toDate:data?.toDate ?? "",
            priorities:data?.priorities ?? []
        };
    }
}