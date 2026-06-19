export interface AuditLogExportRow {

    id: string;

    createdAt: string;

    action: string;

    actorId: string;

    actorEmail: string | null;

    actorFullName: string | null;

    actorRoleName: string | null;

    targetId: string | null;

    targetEmail: string | null;

    targetFullName: string | null;

    targetRoleName: string | null;

    ipAddress: string | null;

    details: string | null;

}