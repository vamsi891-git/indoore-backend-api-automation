import {
  normalizePowerOnCardValue,
  normalizeStatisticCardValue,
  normalizeStatisticSubtitle,
} from "../utils/dtr-backend.util";

export type DtrStatisticsScenario =
  | "dts_by_code_primary"
  | "dts_by_code_alt"
  | "dts_ignore_unknown_query"
  | "contract_degraded_em_dash"
  | "contract_populated_metrics"
  | "contract_trend_formula"
  | "contract_status_limited"
  | "contract_status_under_load"
  | "contract_unbalanced_percent"
  | "contract_power_on_clock"
  | "contract_integer_feeders_fuse"
  | "dtr_not_found"
  | "empty_dtr_code";

export interface StatisticCard {
  title: string;
  value: string;
  subtitle: string | null;
  trendPercent: number | null;
}

export interface DtrStatisticsResponse {
  success: boolean;
  data?: {
    statisticCards: StatisticCard[];
  } | null;
}

export interface DtrStatisticsErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export interface MappedDtrStatistics {
  success: boolean;
  statisticCards: StatisticCard[];
}

export class DtrStatisticsMapper {
  static map(response: DtrStatisticsResponse): MappedDtrStatistics {
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

    return {
      success: response.success,
      statisticCards: cards,
    };
  }
}
