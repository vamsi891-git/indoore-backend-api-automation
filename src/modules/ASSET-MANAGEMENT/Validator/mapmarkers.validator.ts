import { expect } from "@playwright/test";
import {
  EXPECTED_MAP_MARKER_COLUMNS,
  EXPECTED_MAP_MARKER_KINDS,
  EXPECTED_MAP_MARKERS_DATA_COLUMNS,
} from "../Data/mapmarkers.data";
import type { MapMarkersData } from "../Mapper/mapmarkers.mapper";
import { MapMarkersSuccessResponseSchema } from "../schemas/asset-management.schemas";
import { AssetManagementCommonValidator } from "./asset-management-common.validator";

export class MapMarkersValidator {
  validateResponse(body: unknown) {
    AssetManagementCommonValidator.validateSuccessEnvelope(
      body as { success?: boolean },
    );
    AssetManagementCommonValidator.validateZodResponseSchema(
      body,
      MapMarkersSuccessResponseSchema,
    );
  }

  validateColumns(data: MapMarkersData) {
    const dataKeys = Object.keys(data).sort();
    expect(dataKeys).toEqual([...EXPECTED_MAP_MARKERS_DATA_COLUMNS].sort());
    if (data.markers.length === 0) {
      return;
    }
    const keys = Object.keys(data.markers[0]).sort();
    expect(keys).toEqual([...EXPECTED_MAP_MARKER_COLUMNS].sort());
  }

  validateMarkersExist(data: MapMarkersData) {
    expect(data.markers.length).toBeGreaterThan(0);
  }

  validateEmpty(data: MapMarkersData) {
    expect(data.markers).toEqual([]);
    expect(data.count).toEqual(0);
    expect(data.truncated).toEqual(false);
    expect(data.consumerTotal).toEqual(0);
    expect(data.dtrTotal).toEqual(0);
    expect(data.consumerMappedTotal).toEqual(0);
    expect(data.dtrMappedTotal).toEqual(0);
  }

  validateLimit(data: MapMarkersData, requestedLimit: number) {
    expect(data.limit).toEqual(requestedLimit);
    expect(data.count).toBeLessThanOrEqual(requestedLimit);
    expect(data.markers.length).toBeLessThanOrEqual(requestedLimit);
  }

  validateCount(data: MapMarkersData) {
    expect(data.count).toEqual(data.markers.length);
  }

  validateFields(data: MapMarkersData) {
    data.markers.forEach((marker) => {
      expect(marker.id.trim()).not.toEqual("");
      expect(EXPECTED_MAP_MARKER_KINDS).toContain(marker.kind);
      expect(marker.assetId).toBeGreaterThan(0);
      expect(marker.nodeId).toBeGreaterThan(0);
      expect(marker.name.trim()).not.toEqual("");
      expect(Number.isFinite(marker.lat)).toBe(true);
      expect(Number.isFinite(marker.lng)).toBe(true);
      expect(marker.lat).toBeGreaterThanOrEqual(-90);
      expect(marker.lat).toBeLessThanOrEqual(90);
      expect(marker.lng).toBeGreaterThanOrEqual(-180);
      expect(marker.lng).toBeLessThanOrEqual(180);
    });
  }

  validateDuplicateIds(data: MapMarkersData) {
    const ids = data.markers.map((marker) => marker.id);
    const unique = new Set(ids).size;
    if (unique !== ids.length) {
      console.log("Duplicate map marker ids:", {
        total: ids.length,
        unique,
      });
    }
  }

  validateTotals(data: MapMarkersData) {
    expect(data.consumerMappedTotal).toBeLessThanOrEqual(data.consumerTotal);
    expect(data.dtrMappedTotal).toBeLessThanOrEqual(data.dtrTotal);
    expect(data.onlineCount).toBeGreaterThanOrEqual(0);
    expect(data.offlineCount).toBeGreaterThanOrEqual(0);
  }

  validateHierarchyFilter(
    scoped: MapMarkersData,
    unscoped: MapMarkersData,
  ) {
    expect(scoped.consumerTotal).toBeLessThanOrEqual(unscoped.consumerTotal);
    expect(scoped.dtrTotal).toBeLessThanOrEqual(unscoped.dtrTotal);
    expect(scoped.consumerMappedTotal).toBeLessThanOrEqual(
      unscoped.consumerMappedTotal,
    );
    expect(scoped.dtrMappedTotal).toBeLessThanOrEqual(unscoped.dtrMappedTotal);
  }
}
