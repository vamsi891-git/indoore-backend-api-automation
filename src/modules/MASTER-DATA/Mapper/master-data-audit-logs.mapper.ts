export interface MasterDataAuditLogsQuery {
  page?: number;
  limit?: number;
  sort?: string;
  /** Exact master-data audit action (must be in MASTER_DATA_AUDIT_ACTIONS). */
  action?: string;
  /** Prefix filter, e.g. `meter.` — must match ≥1 master-data action. */
  actionPrefix?: string;
}

export interface MasterDataAuditLogsResponse {
  success: boolean;
  data?: MasterDataAuditLogsRawData;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}

export interface ActionFilterOption {
  value: string;
  label: string;
}

export interface MasterDataAuditLogsRawData {
  logs?: MasterDataAuditLog[];
  actionFilterOptions?: ActionFilterOption[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  nextCursor?: string | null;
}

export interface MasterDataAuditLogsData {
  logs: MasterDataAuditLog[];
  actionFilterOptions: ActionFilterOption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextCursor: string | null;
}

export interface MasterDataAuditLog {
  id: string;
  /** Business User ID (`user_credentials.unique_id`), not the UUID. */
  userId: string | null;
  /** Actor UUID (`user_credentials.id`). */
  actorId: string;
  targetId: string | null;
  actorFullName: string | null;
  actorEmail: string | null;
  actorRoleName: string | null;
  targetFullName: string | null;
  targetEmail: string | null;
  targetRoleName: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actionLabel: string;
  actorLabel: string;
  roleLabel: string;
  ipAddressLabel: string;
  detailsLines: string[];
  detailsLabel: string;
}

export class MasterDataAuditLogsMapper {
  static mapData(
    data: MasterDataAuditLogsRawData | undefined,
  ): MasterDataAuditLogsData {
    return {
      logs: data?.logs ?? [],
      actionFilterOptions: data?.actionFilterOptions ?? [],
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      limit: data?.limit ?? 20,
      totalPages: data?.totalPages ?? 0,
      nextCursor: data?.nextCursor ?? null,
    };
  }
}
