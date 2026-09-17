import { expect } from "@playwright/test";
import type { AssetExplorerKind } from "../Data/assetdetail.data";
import {
  EXPECTED_ASSET_COMMUNICATION_SUMMARY_COLUMNS,
  EXPECTED_ASSET_DETAIL_COLUMNS,
  EXPECTED_ASSET_HIERARCHY_PATH_COLUMNS,
  EXPECTED_ASSET_HIERARCHY_SUMMARY_COLUMNS,
  EXPECTED_ASSET_METER_SUMMARY_COLUMNS,
  EXPECTED_ASSET_RECENT_ACTIVITY_COLUMNS,
} from "../Data/assetdetail.data";
import type { AssetDetailData } from "../Mapper/assetdetail.mapper";
import { AssetDetailSuccessResponseSchema } from "../schemas/asset-management.schemas";
import { AssetManagementCommonValidator } from "./asset-management-common.validator";

function isParseableTimestamp(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

export class AssetDetailValidator {
  validateResponse(body: unknown) {
    AssetManagementCommonValidator.validateSuccessEnvelope(
      body as { success?: boolean },
    );
    AssetManagementCommonValidator.validateZodResponseSchema(
      body,
      AssetDetailSuccessResponseSchema,
    );
  }

  validateColumns(data: AssetDetailData) {
    expect(Object.keys(data).sort()).toEqual(
      [...EXPECTED_ASSET_DETAIL_COLUMNS].sort(),
    );

    if (data.hierarchyPath.length > 0) {
      expect(Object.keys(data.hierarchyPath[0]).sort()).toEqual(
        [...EXPECTED_ASSET_HIERARCHY_PATH_COLUMNS].sort(),
      );
    }
    if (data.hierarchySummary.length > 0) {
      expect(Object.keys(data.hierarchySummary[0]).sort()).toEqual(
        [...EXPECTED_ASSET_HIERARCHY_SUMMARY_COLUMNS].sort(),
      );
    }
    if (data.meterSummary != null) {
      expect(Object.keys(data.meterSummary).sort()).toEqual(
        [...EXPECTED_ASSET_METER_SUMMARY_COLUMNS].sort(),
      );
    }
    if (data.communicationSummary != null) {
      expect(Object.keys(data.communicationSummary).sort()).toEqual(
        [...EXPECTED_ASSET_COMMUNICATION_SUMMARY_COLUMNS].sort(),
      );
    }
    expect(Object.keys(data.recentActivity).sort()).toEqual(
      [...EXPECTED_ASSET_RECENT_ACTIVITY_COLUMNS].sort(),
    );
  }

  validateIdentity(
    data: AssetDetailData,
    kind: AssetExplorerKind,
    id: number,
  ) {
    expect(data.id).toEqual(id);
    expect(data.kind).toEqual(kind);
    expect(data.name.trim()).not.toEqual("");
    expect(data.displayName.trim()).not.toEqual("");
    expect(data.type.trim()).not.toEqual("");
    expect(data.status).toEqual("UNKNOWN");

    if (data.code?.trim()) {
      expect(data.code.trim()).not.toEqual("");
    } else {
      console.log("Empty asset detail code:", {
        id: data.id,
        kind: data.kind,
        name: data.name,
        type: data.type,
      });
    }

    if (kind === "dtr") {
      expect(data.type.toUpperCase()).toContain("DTR");
    }
    if (kind === "organisation") {
      expect(data.type.toUpperCase()).not.toContain("DTR");
    }
  }

  validateTimestamps(data: AssetDetailData) {
    if (data.connectedSince != null) {
      expect(isParseableTimestamp(data.connectedSince)).toBe(true);
    }
    if (data.lastUpdatedAt != null) {
      expect(isParseableTimestamp(data.lastUpdatedAt)).toBe(true);
    }
  }

  validateHierarchyPath(data: AssetDetailData) {
    const ids = data.hierarchyPath.map((entry) => entry.id);
    expect(new Set(ids).size).toEqual(ids.length);
    expect(ids).not.toContain(data.id);

    data.hierarchyPath.forEach((entry) => {
      expect(entry.id).toBeGreaterThan(0);
      expect(entry.name.trim()).not.toEqual("");
      expect(entry.type.trim()).not.toEqual("");
      if (entry.code?.trim()) {
        expect(entry.code.trim()).not.toEqual("");
      } else {
        console.log("Empty asset hierarchyPath code:", {
          id: entry.id,
          name: entry.name,
          type: entry.type,
        });
      }
    });
  }

  validateHierarchySummary(data: AssetDetailData) {
    expect(data.hierarchySummary.length).toBeGreaterThan(0);
    const types = data.hierarchySummary.map((row) => row.type);
    expect(new Set(types).size).toEqual(types.length);

    const selfRows = data.hierarchySummary.filter(
      (row) => row.relationship === "SELF",
    );
    expect(selfRows.length).toEqual(1);
    expect(selfRows[0].type).toEqual(data.type);
    expect(selfRows[0].directCount).toBeNull();
    expect(selfRows[0].descendantCount).toBeNull();

    data.hierarchySummary.forEach((row) => {
      expect(row.type.trim()).not.toEqual("");
      expect(row.label.trim()).not.toEqual("");
      expect(["SELF", "ANCESTOR", "DESCENDANT"]).toContain(row.relationship);

      if (row.relationship === "DESCENDANT") {
        expect(row.directCount).not.toBeNull();
        expect(row.descendantCount).not.toBeNull();
        expect(row.directCount as number).toBeGreaterThanOrEqual(0);
        expect(row.descendantCount as number).toBeGreaterThanOrEqual(
          row.directCount as number,
        );
      } else {
        expect(row.directCount).toBeNull();
        expect(row.descendantCount).toBeNull();
      }
    });
  }

  validateCounts(data: AssetDetailData) {
    for (const value of [
      data.consumerCount,
      data.dtrCount,
      data.meterCount,
      data.activeMeterCount,
      data.inactiveMeterCount,
      data.faultyMeterCount,
      data.unknownMeterCount,
    ]) {
      if (value != null) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }

    if (
      data.meterCount != null &&
      data.activeMeterCount != null &&
      data.inactiveMeterCount != null
    ) {
      expect(data.activeMeterCount + data.inactiveMeterCount).toEqual(
        data.meterCount,
      );
    }

    const summary = data.meterSummary;
    if (summary?.available) {
      expect(summary.total).toBeGreaterThanOrEqual(0);
      if (data.meterCount != null) {
        expect(summary.total).toEqual(data.meterCount);
      }
      if (summary.active != null && data.activeMeterCount != null) {
        expect(summary.active).toEqual(data.activeMeterCount);
      }
      if (summary.inactive != null && data.inactiveMeterCount != null) {
        expect(summary.inactive).toEqual(data.inactiveMeterCount);
      }
    }

    const comm = data.communicationSummary;
    if (comm?.available) {
      expect(comm.totalOnline).toEqual(comm.consumerOnline + comm.dtrOnline);
      expect(comm.totalOffline).toEqual(
        comm.consumerOffline + comm.dtrOffline,
      );
      if (data.consumerCount != null && data.dtrCount != null) {
        expect(comm.totalOnline + comm.totalOffline).toEqual(
          data.consumerCount + data.dtrCount,
        );
      }
    }
  }

  validateRecentActivity(data: AssetDetailData) {
    const activity = data.recentActivity;
    expect(typeof activity.available).toBe("boolean");
    expect(Array.isArray(activity.items)).toBe(true);
    expect(activity.total).toBeGreaterThanOrEqual(0);
    expect(activity.items.length).toBeLessThanOrEqual(activity.total);

    if (!activity.available) {
      expect(activity.items).toEqual([]);
      return;
    }

    activity.items.forEach((item) => {
      expect(item.id.trim()).not.toEqual("");
      expect(item.type.trim()).not.toEqual("");
      expect(item.title.trim()).not.toEqual("");
      expect(isParseableTimestamp(item.occurredAt)).toBe(true);
    });
  }
}
