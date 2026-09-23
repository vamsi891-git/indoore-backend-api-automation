import { expect } from "@playwright/test";
import {
  EXPECTED_CATALOG_CLASSIFICATION_KEYS,
  EXPECTED_CATALOG_COMMAND_TYPE_KEYS,
  EXPECTED_CATALOG_EXAMPLE_KEYS,
  EXPECTED_CLASSIFICATION_ITEM_KEYS,
  EXPECTED_COMMANDS_CATALOG_ROOT_KEYS,
  EXPECTED_COMMAND_TYPE_ITEM_KEYS,
  EXPECTED_REQUIRES_STEP_UP_KEYS,
} from "../Data/commands-catalog.data";
import {
  CatalogClassification,
  CatalogCommandType,
  CommandsCatalogData,
  CommandsCatalogResponse,
} from "../Mapper/commands-catalog.mapper";

export class CommandsCatalogValidator {
  validateResponse(body: CommandsCatalogResponse): void {
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  }

  validateErrorResponse(body: CommandsCatalogResponse): void {
    expect(body.success).toBe(false);
    expect(body.error?.code).toBeTruthy();
    expect(body.error?.message).toBeTruthy();
  }

  validateRootKeys(data: object): void {
    expect(Object.keys(data).sort()).toEqual([...EXPECTED_COMMANDS_CATALOG_ROOT_KEYS].sort());
  }

  validateClassifications(items: CatalogClassification[]): void {
    expect(items.length).toBe(EXPECTED_CATALOG_CLASSIFICATION_KEYS.length);
    const keys = items.map((item) => item.key);
    expect(keys.sort()).toEqual([...EXPECTED_CATALOG_CLASSIFICATION_KEYS].sort());
    expect(new Set(keys).size).toBe(keys.length);

    for (const item of items) {
      expect(Object.keys(item).sort()).toEqual([...EXPECTED_CLASSIFICATION_ITEM_KEYS].sort());
      expect(item.key.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.key).toBe(item.key.trim());
      expect(item.label).toBe(item.label.trim());
    }
  }

  validateCommandTypes(
    items: CatalogCommandType[],
    classifications: CatalogClassification[],
  ): void {
    expect(items.length).toBe(EXPECTED_CATALOG_COMMAND_TYPE_KEYS.length);
    const keys = items.map((item) => item.key);
    expect(keys.sort()).toEqual([...EXPECTED_CATALOG_COMMAND_TYPE_KEYS].sort());
    expect(new Set(keys).size).toBe(keys.length);

    const classificationKeys = new Set(classifications.map((c) => c.key));
    const stepUpKeys = new Set(EXPECTED_REQUIRES_STEP_UP_KEYS);

    for (const item of items) {
      for (const required of EXPECTED_COMMAND_TYPE_ITEM_KEYS) {
        expect(item).toHaveProperty(required);
      }
      expect(item.key.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.classificationKey.length).toBeGreaterThan(0);
      expect(item.apiType.length).toBeGreaterThan(0);
      expect(item.endpoint.length).toBeGreaterThan(0);
      expect(item.historyCommandName.length).toBeGreaterThan(0);
      expect(classificationKeys.has(item.classificationKey)).toBe(true);

      if (stepUpKeys.has(item.key as (typeof EXPECTED_REQUIRES_STEP_UP_KEYS)[number])) {
        expect(item.requiresStepUp).toBe(true);
      } else {
        expect(item.requiresStepUp).toBeUndefined();
      }
    }
  }

  validateCommandDataExamples(
    examples: Record<string, Record<string, unknown>>,
    commandTypes: CatalogCommandType[],
  ): void {
    const exampleKeys = Object.keys(examples).sort();
    expect(exampleKeys).toEqual([...EXPECTED_CATALOG_EXAMPLE_KEYS].sort());

    const commandKeys = new Set(commandTypes.map((c) => c.key));
    for (const key of exampleKeys) {
      expect(commandKeys.has(key)).toBe(true);
      expect(typeof examples[key]).toBe("object");
      expect(examples[key]).not.toBeNull();
      expect(Array.isArray(examples[key])).toBe(false);
    }
  }

  validateFullCatalog(data: CommandsCatalogData, rawData?: object): void {
    if (rawData) {
      this.validateRootKeys(rawData);
    }
    this.validateClassifications(data.classifications);
    this.validateCommandTypes(data.commandTypes, data.classifications);
    this.validateCommandDataExamples(data.commandDataExamples, data.commandTypes);
  }
}
