export interface StatisticCard {
    title: string;
    value: string;
    subtitle: string | null;
    trendPercent: number | null;
}

export interface DtrStatisticsResponse {
    success: boolean;
    data: {
        statisticCards: StatisticCard[];
    };
}
export class DtrStatisticsMapper {
    static map(response: DtrStatisticsResponse) {
        return {
            statisticCards:response.data.statisticCards
        };
    }
}