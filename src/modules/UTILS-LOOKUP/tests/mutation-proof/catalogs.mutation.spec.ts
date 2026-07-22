import { test, expect } from "@playwright/test";
import { ConnectionStatusValidator } from "../../Validator/connectionstatus.validator";
import { ConnectionStatusSuccessResponseSchema } from "../../schemas/connection-status.schemas";
import { NetworkValidator } from "../../Validator/networkhierarchy.validator";
import { NetworkHierarchySuccessResponseSchema } from "../../schemas/network-hierarchy.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import {
  sampleConnectionStatusSuccess,
  sampleNetworkHierarchySuccess,
} from "./fixtures/catalog.fixture";
import type { ConnectionStatusData } from "../../Mapper/connectionstatus.mapper";
import type { NetworkData } from "../../Mapper/networkhierarchy.mapper";

test.describe("Mutation proof — Connection statuses", () => {
  test(
    "MUT-UL-CSSTATUS-001 — validateExpectedValues fails when a required name is missing",
    { tag: ["@mutation-proof", "@utils-lookup", "@connection-status"] },
    async () => {
      const mutated: ConnectionStatusData = {
        items: sampleConnectionStatusSuccess.data.items.filter(
          (item) => item.name !== "Connected",
        ),
      };
      const message = captureThrownMessage(() =>
        new ConnectionStatusValidator().validateExpectedValues(mutated),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/Connected|expected|toContain|Received/i);
    },
  );

  test(
    "MUT-UL-CSSTATUS-002 — schema rejects unexpected item field (.strict())",
    { tag: ["@mutation-proof", "@utils-lookup", "@connection-status"] },
    async () => {
      const mutated = structuredClone(sampleConnectionStatusSuccess);
      (mutated.data.items[0] as Record<string, unknown>).debugFlag = true;
      const result = ConnectionStatusSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );
});

test.describe("Mutation proof — Network hierarchy", () => {
  test(
    "MUT-UL-NH-001 — validateOrderSequence fails when order is broken",
    { tag: ["@mutation-proof", "@utils-lookup", "@network-hierarchy"] },
    async () => {
      const mutated: NetworkData = {
        items: sampleNetworkHierarchySuccess.data.items.map((item, index) =>
          index === 1 ? { ...item, order: 99 } : item,
        ),
      };
      const message = captureThrownMessage(() =>
        new NetworkValidator().validateOrderSequence(mutated),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/2|99|expected|Received/i);
    },
  );

  test(
    "MUT-UL-NH-002 — schema rejects unexpected item field (.strict())",
    { tag: ["@mutation-proof", "@utils-lookup", "@network-hierarchy"] },
    async () => {
      const mutated = structuredClone(sampleNetworkHierarchySuccess);
      (mutated.data.items[0] as Record<string, unknown>).debugFlag = true;
      const result = NetworkHierarchySuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );
});
