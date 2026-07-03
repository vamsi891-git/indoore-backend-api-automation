export interface AuditLogsQuery {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface AuditLogsResponse {
  success: boolean;
  data?: AuditLogsRawData;
  error?: { code?: string; message?: string };
}

export interface ActionFilterOption {
  value: string;
  label: string;
}

export interface AuditLogsRawData {
  logs?: AuditLog[];
  actionFilterOptions?: ActionFilterOption[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  nextCursor?: string | null;
}

export interface AuditLogsData {
  logs: AuditLog[];
  actionFilterOptions: ActionFilterOption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextCursor: string | null;
}

export interface AuditLog {
  id: string;
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

export class AuditLogsMapper {
  static mapData(data: AuditLogsRawData | undefined): AuditLogsData {
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
