import { AuditLogExportRow } from "./auditlogexport.types";

export class CsvParser {

    static parseAuditLogCsv(
        csvContent: string
    ): AuditLogExportRow[] {

        const rows =
            csvContent
                .trim()
                .split("\n");

        const headers =
            rows[0]
                .split(",");

        return rows
            .slice(1)
            .map(row => {

                const values =
                    row.split(",");

                return {

                    id:
                        values[0] ?? "",

                    createdAt:
                        values[1] ?? "",

                    action:
                        values[2] ?? "",

                    actorId:
                        values[3] ?? "",

                    actorEmail:
                        values[4] || null,

                    actorFullName:
                        values[5] || null,

                    actorRoleName:
                        values[6] || null,

                    targetId:
                        values[7] || null,

                    targetEmail:
                        values[8] || null,

                    targetFullName:
                        values[9] || null,

                    targetRoleName:
                        values[10] || null,

                    ipAddress:
                        values[11] || null,

                    details:
                        values[12] || null

                };

            });

    }

}