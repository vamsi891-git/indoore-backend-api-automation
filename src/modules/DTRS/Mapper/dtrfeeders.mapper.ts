export type DtrFeedersScenario =
  | "dfe_by_code_primary"
  | "dfe_by_code_alt"
  | "dfe_ignore_unknown_query"
  | "contract_empty_feeders"
  | "contract_populated_feeders"
  | "contract_mixed_statuses"
  | "contract_numeric_id_fallback"
  | "contract_with_communication"
  | "dtr_not_found"
  | "empty_dtr_code";

export type FeederStatus = "Active" | "Inactive";

export interface FeederItem {
  id: string;
  name: string | null;
  status: FeederStatus;
  lastCommunication: string | null;
}

export interface DtrFeedersDataModel {
  feeders: FeederItem[];
}

export interface DtrFeedersResponse {
  success: boolean;
  data?: DtrFeedersDataModel | null;
}

export interface DtrFeedersErrorResponse {
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

export interface MappedDtrFeeders {
  success: boolean;
  feeders: FeederItem[];
}

const EMPTY_FEEDERS: DtrFeedersDataModel = {
  feeders: [],
};

export class DtrFeedersMapper {
  static map(response: DtrFeedersResponse): MappedDtrFeeders {
    const data = response.data ?? EMPTY_FEEDERS;
    return {
      success: response.success,
      feeders: (data.feeders ?? []).map((feeder) => ({
        id: feeder.id,
        name: feeder.name ?? null,
        status: feeder.status,
        lastCommunication: feeder.lastCommunication ?? null,
      })),
    };
  }
}
