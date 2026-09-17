import { test, expect } from "@playwright/test";
import { MapMarkersValidator } from "../../Validator/mapmarkers.validator";
import { MapMarkersSuccessResponseSchema } from "../../schemas/asset-management.schemas";
import { captureThrownMessage } from "./fixtures/capture-throw";
import { sampleMapMarkersSuccess } from "./fixtures/asset-sample.fixture";
import type { MapMarkersData } from "../../Mapper/mapmarkers.mapper";

test.describe("Mutation proof — Map markers", () => {
  test(
    "MUT-AM-MM-001 — schema fails when kind is removed",
    { tag: ["@mutation-proof", "@asset-management", "@map-markers"] },
    async () => {
      const mutated = structuredClone(sampleMapMarkersSuccess);
      delete (mutated.data.markers[0] as Record<string, unknown>).kind;
      const result = MapMarkersSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/kind/i);
      }
    },
  );

  test(
    "MUT-AM-MM-002 — schema rejects unexpected marker field (.strict())",
    { tag: ["@mutation-proof", "@asset-management", "@map-markers"] },
    async () => {
      const mutated = structuredClone(sampleMapMarkersSuccess);
      (mutated.data.markers[0] as Record<string, unknown>).debugFlag = true;
      const result = MapMarkersSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(
          /debugFlag|unrecognized_keys/i,
        );
      }
    },
  );

  test(
    "MUT-AM-MM-003 — schema rejects lat as string",
    { tag: ["@mutation-proof", "@asset-management", "@map-markers"] },
    async () => {
      const mutated = structuredClone(sampleMapMarkersSuccess);
      (mutated.data.markers[0] as Record<string, unknown>).lat = "12.93";
      const result = MapMarkersSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/lat/i);
      }
    },
  );

  test(
    "MUT-AM-MM-004 — validateCount fails when count does not match markers",
    { tag: ["@mutation-proof", "@asset-management", "@map-markers"] },
    async () => {
      const data: MapMarkersData = structuredClone(
        sampleMapMarkersSuccess.data,
      );
      data.count = data.markers.length + 5;
      const message = captureThrownMessage(() =>
        new MapMarkersValidator().validateCount(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/expected|Received|toEqual/i);
    },
  );

  test(
    "MUT-AM-MM-005 — validateTotals fails when mapped exceeds total",
    { tag: ["@mutation-proof", "@asset-management", "@map-markers"] },
    async () => {
      const data: MapMarkersData = structuredClone(
        sampleMapMarkersSuccess.data,
      );
      data.consumerMappedTotal = data.consumerTotal + 1;
      const message = captureThrownMessage(() =>
        new MapMarkersValidator().validateTotals(data),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/expected|Received|toBeLessThanOrEqual/i);
    },
  );

  test(
    "MUT-AM-MM-006 — validateLimit fails when count exceeds requested limit",
    { tag: ["@mutation-proof", "@asset-management", "@map-markers"] },
    async () => {
      const data: MapMarkersData = structuredClone(
        sampleMapMarkersSuccess.data,
      );
      data.limit = 1;
      const message = captureThrownMessage(() =>
        new MapMarkersValidator().validateLimit(data, 1),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/expected|Received|toBeLessThanOrEqual/i);
    },
  );

  test(
    "MUT-AM-MM-007 — validateHierarchyFilter fails when scoped totals grow",
    { tag: ["@mutation-proof", "@asset-management", "@map-markers"] },
    async () => {
      const scoped: MapMarkersData = structuredClone(
        sampleMapMarkersSuccess.data,
      );
      const unscoped: MapMarkersData = structuredClone(
        sampleMapMarkersSuccess.data,
      );
      scoped.consumerTotal = unscoped.consumerTotal + 10;
      const message = captureThrownMessage(() =>
        new MapMarkersValidator().validateHierarchyFilter(scoped, unscoped),
      );
      expect(message).not.toEqual("");
      expect(message).toMatch(/expected|Received|toBeLessThanOrEqual/i);
    },
  );

  test(
    "MUT-AM-MM-008 — schema rejects blank name",
    { tag: ["@mutation-proof", "@asset-management", "@map-markers"] },
    async () => {
      const mutated = structuredClone(sampleMapMarkersSuccess);
      mutated.data.markers[0].name = "   ";
      const result = MapMarkersSuccessResponseSchema.safeParse(mutated);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(JSON.stringify(result.error.issues)).toMatch(/name/i);
      }
    },
  );
});
