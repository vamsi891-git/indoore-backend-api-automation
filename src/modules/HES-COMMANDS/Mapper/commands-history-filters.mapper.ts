export interface HistoryFilterCommandTypeOption {
  value: string;
  label: string;
  historyCommandName: string;
}

export interface CommandsHistoryFiltersData {
  commandTypes: string[];
  commandTypeOptions: HistoryFilterCommandTypeOption[];
  commandTypeDisplayNames: string[];
  statuses: string[];
  selectionTypes: string[];
}

export interface CommandsHistoryFiltersResponse {
  success: boolean;
  data?: CommandsHistoryFiltersData;
  error?: { code: string; message: string };
}

export class CommandsHistoryFiltersMapper {
  static mapResponse(body: CommandsHistoryFiltersResponse): CommandsHistoryFiltersData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful history filters response");
    }
    const data = body.data;
    return {
      commandTypes: (data.commandTypes ?? []).map((v) => String(v).trim()),
      commandTypeOptions: (data.commandTypeOptions ?? []).map((item) => ({
        value: String(item.value ?? "").trim(),
        label: String(item.label ?? "").trim(),
        historyCommandName: String(item.historyCommandName ?? "").trim(),
      })),
      commandTypeDisplayNames: (data.commandTypeDisplayNames ?? []).map((v) => String(v).trim()),
      statuses: (data.statuses ?? []).map((v) => String(v).trim()),
      selectionTypes: (data.selectionTypes ?? []).map((v) => String(v).trim()),
    };
  }
}
