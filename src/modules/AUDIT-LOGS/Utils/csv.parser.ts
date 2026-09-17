import {
  AuditLogExportParseResult,
  AuditLogExportRow,
} from "./auditlogexport.types";

const HEADER_ALIASES: Record<string, keyof AuditLogExportRow> = {
  id: "id",
  Id: "id",
  createdAt: "createdAt",
  "Created At": "createdAt",
  action: "action",
  Action: "action",
  actorId: "actorId",
  "Actor Id": "actorId",
  actorEmail: "actorEmail",
  "Actor Email": "actorEmail",
  actorFullName: "actorFullName",
  "Actor Full Name": "actorFullName",
  actorRoleName: "actorRoleName",
  "Actor Role Name": "actorRoleName",
  targetId: "targetId",
  "Target Id": "targetId",
  targetEmail: "targetEmail",
  "Target Email": "targetEmail",
  targetFullName: "targetFullName",
  "Target Full Name": "targetFullName",
  targetRoleName: "targetRoleName",
  "Target Role Name": "targetRoleName",
  ipAddress: "ipAddress",
  "Ip Address": "ipAddress",
  "IP Address": "ipAddress",
  details: "details",
  Details: "details",
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

function emptyRow(): AuditLogExportRow {
  return {
    id: "",
    createdAt: "",
    action: "",
    actorId: "",
    actorEmail: null,
    actorFullName: null,
    actorRoleName: null,
    targetId: null,
    targetEmail: null,
    targetFullName: null,
    targetRoleName: null,
    ipAddress: null,
    details: null,
  };
}

function nullable(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null") {
    return null;
  }
  return trimmed;
}

export class CsvParser {
  static parseAuditLogCsv(csvContent: string): AuditLogExportRow[] {
    return CsvParser.parse(csvContent).rows;
  }

  static parse(csvContent: string): AuditLogExportParseResult {
    const text = csvContent.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    const lines = text
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line, index) => index === 0 || line.trim().length > 0);

    if (lines.length === 0 || lines[0].trim().length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = splitCsvLine(lines[0]).map((header) =>
      header.replace(/^\uFEFF/, "").trim(),
    );
    const rows = lines.slice(1).map((line) => {
      const values = splitCsvLine(line);
      const row = emptyRow();
      headers.forEach((header, index) => {
        const field = HEADER_ALIASES[header];
        if (!field) {
          return;
        }
        const raw = values[index] ?? "";
        if (
          field === "id" ||
          field === "createdAt" ||
          field === "action" ||
          field === "actorId"
        ) {
          row[field] = raw.trim();
        } else {
          row[field] = nullable(raw);
        }
      });
      return row;
    });

    return { headers, rows };
  }
}
