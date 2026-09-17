export type AssetExportRow = {
  hierarchyType: string;
  assetCode: string;
  assetName: string;
  displayName: string;
  parentType: string;
  parentCode: string;
  parentName: string;
  consumerCount: string;
  meterCount: string;
};

export type AssetExportData = {
  headers: string[];
  items: AssetExportRow[];
};

const HEADER_ALIASES: Record<string, keyof AssetExportRow> = {
  hierarchyType: "hierarchyType",
  "Hierarchy Type": "hierarchyType",
  assetCode: "assetCode",
  "Asset Code": "assetCode",
  "Office Code": "assetCode",
  assetName: "assetName",
  "Asset Name": "assetName",
  "Office Name": "assetName",
  displayName: "displayName",
  "Display Name": "displayName",
  parentType: "parentType",
  "Parent Type": "parentType",
  parentCode: "parentCode",
  "Parent Code": "parentCode",
  parentName: "parentName",
  "Parent Name": "parentName",
  consumerCount: "consumerCount",
  "Consumer Count": "consumerCount",
  meterCount: "meterCount",
  "Meter Count": "meterCount",
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

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim();
}

function emptyRow(): AssetExportRow {
  return {
    hierarchyType: "",
    assetCode: "",
    assetName: "",
    displayName: "",
    parentType: "",
    parentCode: "",
    parentName: "",
    consumerCount: "",
    meterCount: "",
  };
}

export class AssetExportMapper {
  static mapCsv(csvContent: string): AssetExportData {
    const text = csvContent.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
    const lines = text
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line, index) => index === 0 || line.trim().length > 0);

    if (lines.length === 0 || lines[0].trim().length === 0) {
      return { headers: [], items: [] };
    }

    const headers = splitCsvLine(lines[0]).map(normalizeHeader);
    const items = lines.slice(1).map((line) => {
      const values = splitCsvLine(line);
      const row = emptyRow();
      headers.forEach((header, index) => {
        const field = HEADER_ALIASES[header];
        if (field) {
          row[field] = (values[index] ?? "").trim();
        }
      });
      return row;
    });

    return { headers, items };
  }
}
