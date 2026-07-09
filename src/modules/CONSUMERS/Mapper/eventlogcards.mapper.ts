export type EventLogCardsScenario =
  | "elc_by_ivrs"
  | "elc_by_account"
  | "elc_by_meter"
  | "elc_ignore_unknown_query"
  | "contract_empty_cards"
  | "contract_nonzero_cards"
  | "contract_trend_formula"
  | "contract_avg_display"
  | "consumer_not_found"
  | "meter_not_found"
  | "empty_consumer_ref";

export interface EventLogCountCard {
  title: string;
  value: number;
  trendPercent: number;
  comparisonLabel: string;
}

export interface EventLogAvgResolutionCard {
  title: string;
  valueMinutes: number;
  valueDisplay: string;
  trendPercent: number;
  comparisonLabel: string;
}

export interface EventLogCardsData {
  resolvedEvents: EventLogCountCard;
  pendingEvents: EventLogCountCard;
  avgResolutionTime: EventLogAvgResolutionCard;
}

export interface EventLogCardsResponse {
  success: boolean;
  data?: EventLogCardsData | null;
}

export interface EventLogCardsErrorResponse {
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

export interface MappedEventLogCards {
  success: boolean;
  data: EventLogCardsData | null;
  resolvedEvents: EventLogCountCard | null;
  pendingEvents: EventLogCountCard | null;
  avgResolutionTime: EventLogAvgResolutionCard | null;
}

export class EventLogCardsMapper {
  static map(response: EventLogCardsResponse): MappedEventLogCards {
    const data = response.data ?? null;
    return {
      success: response.success,
      data,
      resolvedEvents: data?.resolvedEvents ?? null,
      pendingEvents: data?.pendingEvents ?? null,
      avgResolutionTime: data?.avgResolutionTime ?? null,
    };
  }
}
