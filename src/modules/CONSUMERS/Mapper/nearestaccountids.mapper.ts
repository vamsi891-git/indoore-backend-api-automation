export type NearestAccountIdsScenario =
  | "nearest_found"
  | "default_limit"
  | "custom_limit"
  | "max_distance_empty"
  | "no_numeric_suffix"
  | "prefixed_account_id"
  | "missing_account_id"
  | "empty_account_id"
  | "invalid_limit_zero"
  | "invalid_limit_max";

export interface NearestAccountIdsData {
  accountId: string;
  numericSuffix: number | null;
  maxDistance: number;
  nearestAccountIds: string[];
}

export interface NearestAccountIdsResponse {
  success: boolean;
  data: NearestAccountIdsData;
}

export interface NearestAccountIdsErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export class NearestAccountIdsMapper {
  static map(response: NearestAccountIdsResponse): NearestAccountIdsResponse {
    return response;
  }

  static mapData(response: NearestAccountIdsResponse): NearestAccountIdsData {
    return response.data ?? ({} as NearestAccountIdsData);
  }
}

export function extractTrailingAccountIdNumber(
  accountId: string,
): number | null {
  const match = accountId.trim().match(/([0-9]+)$/);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function accountIdNumericDistance(
  baseSuffix: number,
  candidateAccountId: string,
): number | null {
  const suffix = extractTrailingAccountIdNumber(candidateAccountId);
  if (suffix == null) {
    return null;
  }
  return Math.abs(suffix - baseSuffix);
}
