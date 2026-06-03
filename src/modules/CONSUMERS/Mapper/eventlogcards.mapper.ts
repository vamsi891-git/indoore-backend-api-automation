export interface EventLogCardsResponse {
    success: boolean;
    data: any;
}
export class EventLogCardsMapper {
    static map(response: EventLogCardsResponse) {
        const data = response.data;
        return {
            resolvedEvents:data.resolvedEvents,
            pendingEvents:data.pendingEvents,
            avgResolutionTime:data.avgResolutionTime
        };
    }
}   