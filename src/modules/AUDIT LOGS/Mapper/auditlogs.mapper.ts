export interface AuditLogsResponse {
    success: boolean;
    data: AuditLogsData;
}
export interface AuditLogsData {
    logs: AuditLog[];
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
}
export class AuditLogsMapper {
    static mapData( data: AuditLogsData): AuditLogsData {
        return {
            logs:data.logs ?? [],
            total:data.total ?? 0,
            page:data.page ?? 1,
            limit:data.limit ?? 20,
            totalPages:data.totalPages ?? 0,
            nextCursor:data.nextCursor ?? null
        };
    }
}