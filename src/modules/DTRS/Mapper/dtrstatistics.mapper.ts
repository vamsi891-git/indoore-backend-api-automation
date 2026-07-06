import {
    normalizePowerOnCardValue,
    normalizeStatisticCardValue,
    normalizeStatisticSubtitle,
} from "../utils/dtr-backend.util";

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
        const cards = (response.data?.statisticCards ?? []).map((card) => {
            let value = normalizeStatisticCardValue(card.title, card.value);
            if (card.title === "Power On") {
                value = normalizePowerOnCardValue(value);
            }
            if (card.title === "Power Off") {
                value = "00:00:00";
            }

            return {
                ...card,
                value,
                subtitle: normalizeStatisticSubtitle(card.title, card.subtitle),
            };
        });

        return { statisticCards: cards };
    }
}
