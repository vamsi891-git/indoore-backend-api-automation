import { expect } from "@playwright/test";
import { test } from "../../../../src/fixtures/api.fixture";
import { ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { NetworkHierarchyApi } from "../Api/networkhierarchy.api";
import type { NetworkNode } from "../Mapper/networkhierarchy.mapper";
import {
  findFirstEmptyNetworkCode,
  findFirstFeederWithDtrs,
  findFirstFeederWithEmptyDtrs,
} from "../utils/asset-management.helper";
import { runNetworkHierarchyValidation } from "./network-hierarchy.harness";

test.describe("Network Hierarchy API", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS);

  let hierarchy: NetworkNode[] = [];

  test(
    "Validate Network Hierarchy API",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const api = new NetworkHierarchyApi(authenticatedApi);
      const result = await runNetworkHierarchyValidation({
        api,
        testLabel: "Network Hierarchy API",
      });
      hierarchy = result.hierarchy;

      const emptyDtrsFeeder = findFirstFeederWithEmptyDtrs(hierarchy);
      if (emptyDtrsFeeder) {
        expect(emptyDtrsFeeder.dtrs).toEqual([]);
      }

      const emptyCode = findFirstEmptyNetworkCode(hierarchy);
      if (emptyCode) {
        expect(emptyCode.networkCode?.trim() ?? "").toEqual("");
      }
    },
  );

  test(
    "GET /asset-management/network-hierarchy — feeder subtree with DTRs",
    { tag: ["@smoke", "@hierarchy", "@asset-management"] },
    async ({ authenticatedApi }) => {
      const feeder = findFirstFeederWithDtrs(hierarchy);
      if (feeder == null) {
        test.skip(true, "No feeder with catalog DTRs in the full network tree");
        return;
      }

      const api = new NetworkHierarchyApi(authenticatedApi);
      await runNetworkHierarchyValidation({
        api,
        rootId: feeder.networkLookupId,
        includeSubtreeChecks: true,
        testLabel: "Network Hierarchy — Feeder subtree",
      });
    },
  );
});
