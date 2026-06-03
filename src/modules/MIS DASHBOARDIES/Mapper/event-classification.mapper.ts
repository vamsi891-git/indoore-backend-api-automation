export interface Classification {
    category: string;
    label: string;
    currentDay: number;
    previousDay: number;
}
export interface EventClassificationData {
    reportType: string;
    currentDate: string;
    previousDate: string;
    totalEventsCurrentDay: number;
    totalEventsPreviousDay: number;
    classifications:Classification[];
}
export interface EventClassificationResponse {
    success: boolean;
    data:EventClassificationData;
}
export class EventClassificationMapper {
    static map(data: any): EventClassificationData {
        return {
            reportType:String(data?.reportType ?? ""),
            currentDate:String(data?.currentDate ?? ""),
            previousDate:
                String(data?.previousDate ?? ""),
            totalEventsCurrentDay:Number(data?.totalEventsCurrentDay ?? 0),
            totalEventsPreviousDay: Number(data?.totalEventsPreviousDay ?? 0),
            classifications:(data?.classifications ?? []).map((x: any): Classification => ({category:String(x?.category ?? ""),
                            label:String(x?.label ?? ""),
                           currentDay:Number(x?.currentDay ?? 0 ),
                            previousDay:Number(x?.previousDay ?? 0 )
                        })
                    )
        };
    }

}