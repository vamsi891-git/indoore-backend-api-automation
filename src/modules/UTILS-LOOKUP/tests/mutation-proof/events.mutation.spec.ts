import { test, expect } from "@playwright/test";
import { EventValidator } from "../../Validator/event.validator";
import { captureThrownMessage } from "./fixtures/capture-throw";
import type { EventData } from "../../Mapper/event.mapper";

/**
 * Only Events has a rule class not already proven by ConnectionStatus /
 * NetworkHierarchy / search pagination: allow-list for eventReferenceTable.
 */
test.describe("Mutation proof — Events (reference-table allow-list)", () => {
  test(
    "MUT-UL-EVT-001 — validateReferenceTables fails for unknown eventReferenceTable",
    { tag: ["@mutation-proof", "@utils-lookup", "@events"] },
    async () => {
      const mutated: EventData = {
        items: [
          {
            id: 1,
            code: 10,
            name: "Sample Event",
            description: "desc",
            eventReferenceTable: "NotARealTable",
          },
        ],
      };

      const message = captureThrownMessage(() =>
        new EventValidator().validateReferenceTables(mutated),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(
        /NotARealTable|Others|Transaction|toContain|expected|Received/i,
      );
    },
  );
});
