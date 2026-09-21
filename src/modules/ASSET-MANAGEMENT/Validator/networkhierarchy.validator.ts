import { expect } from "@playwright/test";
import { NetworkHierarchyData, NetworkNode } from "../Mapper/networkhierarchy.mapper";
import { AssetManagementCommonValidator } from "./asset-management-common.validator";
import { NetworkHierarchySuccessResponseSchema } from "../schemas/asset-management.schemas";

export class NetworkHierarchyValidator {
  validateResponse(body: unknown) {
    AssetManagementCommonValidator.validateSuccessEnvelope(body as { success?: boolean });
    AssetManagementCommonValidator.validateZodResponseSchema(
      body,
      NetworkHierarchySuccessResponseSchema,
    );
  }

  validateItemsExist(data: NetworkHierarchyData) {
    expect(data.hierarchy.length).toBeGreaterThan(0);
  }
  validateHierarchyFields(nodes: NetworkNode[]) {
    let emptyNetworkCodeCount = 0;
    const walk = (items: NetworkNode[]) => {
      items.forEach((node) => {
        expect(node.networkLookupId).toBeGreaterThan(0);
        expect(node.networkName).toBeTruthy();
        expect(node.networkName.trim()).not.toEqual("");
        if (node.networkCode?.trim()) {
          expect(node.networkCode.trim()).not.toEqual("");
        } else {
          emptyNetworkCodeCount += 1;
        }
        node.dtrs.forEach((dtr) => {
          expect(dtr.networkLookupId).toBeGreaterThan(0);
          expect(dtr.dtrName).toBeTruthy();
          expect(Number.isInteger(dtr.consumerCount)).toBe(true);
          expect(dtr.consumerCount).toBeGreaterThanOrEqual(0);
          if (dtr.dtrMeter) {
            expect(dtr.dtrMeter.meterLookupId).toBeGreaterThan(0);
            if (dtr.dtrMeter.latitude != null) {
              expect(typeof dtr.dtrMeter.latitude).toBe("string");
            }
            if (dtr.dtrMeter.longitude != null) {
              expect(typeof dtr.dtrMeter.longitude).toBe("string");
            }
          }
        });
        if (node.children.length) {
          walk(node.children);
        }
      });
    };
    walk(nodes);
    if (emptyNetworkCodeCount > 0) {
      console.log(`Empty networkCode nodes (allowed): ${emptyNetworkCodeCount}`);
    }
  }
  validateDuplicateIds(nodes: NetworkNode[]) {
    const ids: number[] = [];
    const extract = (items: NetworkNode[]) => {
      items.forEach((x) => {
        ids.push(x.networkLookupId);
        x.dtrs.forEach((d) => ids.push(d.networkLookupId));
        extract(x.children);
      });
    };
    extract(nodes);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  }
  validateExpectedLevels(nodes: NetworkNode[]) {
    const levels = ["Sub Station", "Feeder"];
    const found: string[] = [];
    const extract = (items: NetworkNode[]) => {
      items.forEach((x) => {
        found.push(x.hierarchyLevel);
        extract(x.children);
      });
    };
    extract(nodes);
    levels.forEach((level) => {
      expect(found).toContain(level);
    });
  }

  /**
   * Explorer tree nodes are Sub Station / Feeder only.
   * Catalog DTRs are attached on parent `dtrs`, not as `children`.
   */
  validateEligibleTreeLevels(nodes: NetworkNode[]) {
    const walk = (items: NetworkNode[]) => {
      items.forEach((node) => {
        const level = node.hierarchyLevel ?? "";
        const eligible = /sub\s*station/i.test(level) || /feeder/i.test(level);
        expect(
          eligible,
          `unexpected hierarchyLevel on networkLookupId ${node.networkLookupId}: ${level}`,
        ).toBe(true);
        walk(node.children ?? []);
      });
    };
    walk(nodes);
  }

  /** Backend excludes DTR nodes from the tree — they appear only under parent `dtrs`. */
  validateDtrsNotInChildren(nodes: NetworkNode[]) {
    const walk = (items: NetworkNode[]) => {
      items.forEach((node) => {
        expect(node.hierarchyLevel.toUpperCase()).not.toContain("DTR");
        walk(node.children);
      });
    };
    walk(nodes);
  }

  /** Catalog DTR lookup ids must not also appear as Sub Station / Feeder children. */
  validateDtrIdsNotInChildren(nodes: NetworkNode[]) {
    const treeIds = new Set<number>();
    const dtrIds: number[] = [];
    const walk = (items: NetworkNode[]) => {
      items.forEach((node) => {
        treeIds.add(node.networkLookupId);
        for (const dtr of node.dtrs ?? []) {
          dtrIds.push(dtr.networkLookupId);
        }
        walk(node.children ?? []);
      });
    };
    walk(nodes);
    for (const dtrId of dtrIds) {
      expect(treeIds.has(dtrId), `DTR networkLookupId ${dtrId} also appears in children`).toBe(
        false,
      );
    }
  }

  validateDtrArrays(nodes: NetworkNode[]) {
    const walk = (items: NetworkNode[]) => {
      items.forEach((node) => {
        expect(Array.isArray(node.dtrs)).toBe(true);
        expect(Array.isArray(node.children)).toBe(true);
        const dtrIds = node.dtrs.map((d) => d.networkLookupId);
        expect(new Set(dtrIds).size).toEqual(dtrIds.length);
        walk(node.children);
      });
    };
    walk(nodes);
  }

  validateSubtreeRoot(nodes: NetworkNode[], rootId: number) {
    expect(nodes.length).toBeGreaterThan(0);
    const ids = new Set<number>();
    const walk = (items: NetworkNode[]) => {
      items.forEach((node) => {
        ids.add(node.networkLookupId);
        walk(node.children);
      });
    };
    walk(nodes);
    expect(ids.has(rootId)).toBe(true);
  }
}
