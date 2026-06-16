export interface EventLogCardsResponse {
    success: boolean;
    data?: any;
}
export class EventLogCardsMapper {
    static map(response: EventLogCardsResponse) {
        const normalizeCard = (input: any, fallbackTitle: string) => ({
            title: input?.title ?? fallbackTitle,
            value: input?.value ?? input?.count ?? input?.total ?? 0,
            trendPercent:
                input?.trendPercent ??
                input?.trend_percentage ??
                input?.trend ??
                0
        });
        const normalizeAvg = (input: any) => {
            const valueMinutes = input?.valueMinutes ?? input?.value ?? input?.minutes ?? 0;
            return {
                title: input?.title ?? "Avg Resolution Time",
                valueMinutes,
                valueDisplay: input?.valueDisplay ?? `${valueMinutes}m`,
                trendPercent:
                    input?.trendPercent ??
                    input?.trend_percentage ??
                    input?.trend ??
                    0
            };
        };
        const data = response.data ?? {};
        const cards = data.cards ?? {};
        const resolvedRaw = data.resolvedEvents ?? data.resolved ?? cards.resolvedEvents ?? cards.resolved ?? null;
        const pendingRaw = data.pendingEvents ?? data.pending ?? cards.pendingEvents ?? cards.pending ?? null;
        const avgResolutionTime =
            normalizeAvg(
                data.avgResolutionTime ??
                data.averageResolutionTime ??
                data.avgResolution ??
                cards.avgResolutionTime ??
                cards.averageResolutionTime ??
                cards.avgResolution ??
                null
            );
        return {
            resolvedEvents: normalizeCard(resolvedRaw, "Resolved Events"),
            pendingEvents: normalizeCard(pendingRaw, "Pending Events"),
            avgResolutionTime
        };
    }
}   