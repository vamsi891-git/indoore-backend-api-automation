export type DtrProfileScenario =
  | "dpr_by_code_primary"
  | "dpr_by_code_alt"
  | "dpr_ignore_unknown_query"
  | "contract_live_11iw3"
  | "contract_null_optional_fields"
  | "contract_empty_activities"
  | "contract_with_activities"
  | "contract_capacity_kva"
  | "contract_deep_hierarchy"
  | "dtr_not_found"
  | "empty_dtr_code";

export interface ProfileItem {
  title: string;
  value: string | null;
}

export interface ActivityItem {
  title: string;
  timestamp: string;
}

export interface DtrProfileDataModel {
  profileInformation: ProfileItem[];
  hierarchy: ProfileItem[];
  latestActivities: ActivityItem[];
}

export interface DtrProfileResponse {
  success: boolean;
  data?: DtrProfileDataModel | null;
}

export interface DtrProfileErrorResponse {
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

export interface MappedDtrProfile {
  success: boolean;
  profileInformation: ProfileItem[];
  hierarchy: ProfileItem[];
  latestActivities: ActivityItem[];
}

const EMPTY_PROFILE: DtrProfileDataModel = {
  profileInformation: [],
  hierarchy: [],
  latestActivities: [],
};

export class DtrProfileMapper {
  static map(response: DtrProfileResponse): MappedDtrProfile {
    const data = response.data ?? EMPTY_PROFILE;
    return {
      success: response.success,
      profileInformation: data.profileInformation ?? [],
      hierarchy: data.hierarchy ?? [],
      latestActivities: data.latestActivities ?? [],
    };
  }
}
