import { expect } from "@playwright/test";
import {
  EXPECTED_HISTORY_FILTER_COMMAND_TYPES,
  EXPECTED_HISTORY_FILTER_OPTION_KEYS,
  EXPECTED_HISTORY_FILTER_SELECTION_TYPES,
  EXPECTED_HISTORY_FILTER_STATUSES,
  EXPECTED_HISTORY_FILTERS_ROOT_KEYS,
} from "../Data/commands-history-filters.data";
import {
  CommandsHistoryFiltersData,
  CommandsHistoryFiltersResponse,
  HistoryFilterCommandTypeOption,
} from "../Mapper/commands-history-filters.mapper";

export class CommandsHistoryFiltersValidator {
  validateResponse(body: CommandsHistoryFiltersResponse): void {
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  }

  validateErrorResponse(body: CommandsHistoryFiltersResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateRootKeys(data: object): void {
    expect(Object.keys(data).sort()).toEqual([...EXPECTED_HISTORY_FILTERS_ROOT_KEYS].sort());
  }

  validateCommandTypes(commandTypes: string[]): void {
    expect(commandTypes.length).toBe(EXPECTED_HISTORY_FILTER_COMMAND_TYPES.length);
    expect([...commandTypes].sort()).toEqual([...EXPECTED_HISTORY_FILTER_COMMAND_TYPES].sort());
    expect(new Set(commandTypes).size).toBe(commandTypes.length);
    for (const value of commandTypes) {
      expect(value.length).toBeGreaterThan(0);
      expect(value).toBe(value.trim());
      expect(value).toMatch(/^[a-z0-9_]+$/);
    }
  }

  validateCommandTypeOptions(
    options: HistoryFilterCommandTypeOption[],
    commandTypes: string[],
  ): void {
    expect(options.length).toBe(commandTypes.length);
    expect(options.map((o) => o.value)).toEqual(commandTypes);

    for (const option of options) {
      expect(Object.keys(option).sort()).toEqual([...EXPECTED_HISTORY_FILTER_OPTION_KEYS].sort());
      expect(option.value.length).toBeGreaterThan(0);
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.historyCommandName.length).toBeGreaterThan(0);
    }
  }

  validateCommandTypeDisplayNames(
    displayNames: string[],
    options: HistoryFilterCommandTypeOption[],
  ): void {
    expect(displayNames.length).toBe(options.length);
    expect(displayNames).toEqual(options.map((o) => o.historyCommandName));
    for (const name of displayNames) {
      expect(name.length).toBeGreaterThan(0);
      expect(name).toBe(name.trim());
    }
  }

  validateStatuses(statuses: string[]): void {
    expect(statuses.length).toBe(EXPECTED_HISTORY_FILTER_STATUSES.length);
    expect([...statuses].sort()).toEqual([...EXPECTED_HISTORY_FILTER_STATUSES].sort());
    expect(new Set(statuses).size).toBe(statuses.length);
  }

  validateSelectionTypes(selectionTypes: string[]): void {
    expect(selectionTypes.length).toBe(EXPECTED_HISTORY_FILTER_SELECTION_TYPES.length);
    expect([...selectionTypes].sort()).toEqual([...EXPECTED_HISTORY_FILTER_SELECTION_TYPES].sort());
  }

  validateFullFilters(data: CommandsHistoryFiltersData, rawData?: object): void {
    if (rawData) {
      this.validateRootKeys(rawData);
    }
    this.validateCommandTypes(data.commandTypes);
    this.validateCommandTypeOptions(data.commandTypeOptions, data.commandTypes);
    this.validateCommandTypeDisplayNames(data.commandTypeDisplayNames, data.commandTypeOptions);
    this.validateStatuses(data.statuses);
    this.validateSelectionTypes(data.selectionTypes);
  }
}
