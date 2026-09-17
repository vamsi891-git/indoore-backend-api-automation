import { test } from "../../../../src/fixtures/api.fixture";
import { ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS } from "../../../core/constants/api-timeouts";
import { HierarchyChildrenApi } from "../Api/hierarchychildren.api";
import { MapMarkersApi } from "../Api/mapmarkers.api";
import { AssetManagementNegativeData } from "../Data/asset-management.common.data";
import { hierarchyChildrenQuery } from "../Data/hierarchychildren.data";
import {
  DEFAULT_MAP_MARKERS_LIMIT,
  mapMarkersQuery,
} from "../Data/mapmarkers.data";
import { MapMarkersValidator } from "../Validator/mapmarkers.validator";
import { runMapMarkersValidation } from "./mapmarkers.harness";

test.describe("Map Markers API", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(ASSET_MANAGEMENT_COVERAGE_TEST_TIMEOUT_MS);

  let networkRootId: number | undefined;
  let organisationRootId: number | undefined;
  let networkUnscoped:
    | Awaited<ReturnType<typeof runMapMarkersValidation>>["data"]
    | undefined;
  let organisationUnscoped:
    | Awaited<ReturnType<typeof runMapMarkersValidation>>["data"]
    | undefined;

  test(
    "GET /asset-management/map-markers — mode=network&limit=2000",
    { tag: ["@smoke", "@asset-management", "@map-markers"] },
    async ({ authenticatedApi }) => {
      const childrenApi = new HierarchyChildrenApi(authenticatedApi);
      const { responseBody } = await childrenApi.getHierarchyChildren(
        hierarchyChildrenQuery({ mode: "network", page: 1, pageSize: 20 }),
      );
      networkRootId = responseBody.data?.items?.[0]?.id;

      const result = await runMapMarkersValidation({
        api: new MapMarkersApi(authenticatedApi),
        query: mapMarkersQuery({
          mode: "network",
          limit: DEFAULT_MAP_MARKERS_LIMIT,
        }),
        requestedLimit: DEFAULT_MAP_MARKERS_LIMIT,
        testLabel: "Map Markers — Network",
      });
      networkUnscoped = result.data;
    },
  );

  test(
    "GET /asset-management/map-markers — mode=organisation&limit=2000",
    { tag: ["@smoke", "@asset-management", "@map-markers"] },
    async ({ authenticatedApi }) => {
      const childrenApi = new HierarchyChildrenApi(authenticatedApi);
      const { responseBody } = await childrenApi.getHierarchyChildren(
        hierarchyChildrenQuery({
          mode: "organisation",
          page: 1,
          pageSize: 20,
        }),
      );
      organisationRootId = responseBody.data?.items?.[0]?.id;

      const result = await runMapMarkersValidation({
        api: new MapMarkersApi(authenticatedApi),
        query: mapMarkersQuery({
          mode: "organisation",
          limit: DEFAULT_MAP_MARKERS_LIMIT,
        }),
        requestedLimit: DEFAULT_MAP_MARKERS_LIMIT,
        testLabel: "Map Markers — Organisation",
      });
      organisationUnscoped = result.data;
    },
  );

  test(
    "GET /asset-management/map-markers — mode=network&limit=50",
    { tag: ["@smoke", "@asset-management", "@map-markers"] },
    async ({ authenticatedApi }) => {
      await runMapMarkersValidation({
        api: new MapMarkersApi(authenticatedApi),
        query: mapMarkersQuery({ mode: "network", limit: 50 }),
        requestedLimit: 50,
        testLabel: "Map Markers — Network limit 50",
      });
    },
  );

  test(
    "GET /asset-management/map-markers — mode=network&hierarchyId node",
    { tag: ["@smoke", "@asset-management", "@map-markers"] },
    async ({ authenticatedApi }) => {
      if (networkRootId == null) {
        test.skip(true, "No network roots from hierarchy/children");
        return;
      }
      const { data } = await runMapMarkersValidation({
        api: new MapMarkersApi(authenticatedApi),
        query: mapMarkersQuery({
          mode: "network",
          limit: DEFAULT_MAP_MARKERS_LIMIT,
          hierarchyId: networkRootId,
        }),
        requestedLimit: DEFAULT_MAP_MARKERS_LIMIT,
        requireMarkers: false,
        testLabel: "Map Markers — Network hierarchyId",
      });
      if (networkUnscoped != null) {
        new MapMarkersValidator().validateHierarchyFilter(
          data,
          networkUnscoped,
        );
      }
    },
  );

  test(
    "GET /asset-management/map-markers — mode=organisation&hierarchyId node",
    { tag: ["@smoke", "@asset-management", "@map-markers"] },
    async ({ authenticatedApi }) => {
      if (organisationRootId == null) {
        test.skip(true, "No organisation roots from hierarchy/children");
        return;
      }
      const { data } = await runMapMarkersValidation({
        api: new MapMarkersApi(authenticatedApi),
        query: mapMarkersQuery({
          mode: "organisation",
          limit: DEFAULT_MAP_MARKERS_LIMIT,
          hierarchyId: organisationRootId,
        }),
        requestedLimit: DEFAULT_MAP_MARKERS_LIMIT,
        requireMarkers: false,
        testLabel: "Map Markers — Organisation hierarchyId",
      });
      if (organisationUnscoped != null) {
        new MapMarkersValidator().validateHierarchyFilter(
          data,
          organisationUnscoped,
        );
      }
    },
  );

  test(
    "GET /asset-management/map-markers — unknown hierarchyId is empty",
    { tag: ["@smoke", "@asset-management", "@map-markers"] },
    async ({ authenticatedApi }) => {
      await runMapMarkersValidation({
        api: new MapMarkersApi(authenticatedApi),
        query: mapMarkersQuery({
          mode: "network",
          limit: 50,
          hierarchyId: AssetManagementNegativeData.unknownNetworkLookupId,
        }),
        requestedLimit: 50,
        requireMarkers: false,
        expectEmpty: true,
        testLabel: "Map Markers — Unknown hierarchyId",
      });
    },
  );
});
