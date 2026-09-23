export interface CatalogClassification {
  key: string;
  label: string;
}

export interface CatalogCommandType {
  key: string;
  label: string;
  classificationKey: string;
  apiType: string;
  endpoint: string;
  historyCommandName: string;
  requiresStepUp?: boolean;
}

export interface CommandsCatalogData {
  classifications: CatalogClassification[];
  commandTypes: CatalogCommandType[];
  commandDataExamples: Record<string, Record<string, unknown>>;
}

export interface CommandsCatalogResponse {
  success: boolean;
  data?: CommandsCatalogData;
  error?: { code: string; message: string };
}

export class CommandsCatalogMapper {
  static mapResponse(body: CommandsCatalogResponse): CommandsCatalogData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful commands catalog response");
    }
    const data = body.data;
    return {
      classifications: (data.classifications ?? []).map((item) => ({
        key: String(item.key ?? "").trim(),
        label: String(item.label ?? "").trim(),
      })),
      commandTypes: (data.commandTypes ?? []).map((item) => ({
        key: String(item.key ?? "").trim(),
        label: String(item.label ?? "").trim(),
        classificationKey: String(item.classificationKey ?? "").trim(),
        apiType: String(item.apiType ?? "").trim(),
        endpoint: String(item.endpoint ?? "").trim(),
        historyCommandName: String(item.historyCommandName ?? "").trim(),
        ...(item.requiresStepUp === true ? { requiresStepUp: true } : {}),
      })),
      commandDataExamples: data.commandDataExamples ?? {},
    };
  }
}
