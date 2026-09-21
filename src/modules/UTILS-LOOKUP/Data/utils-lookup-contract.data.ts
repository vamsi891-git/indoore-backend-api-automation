import type { APIRequestContext, APIResponse } from "@playwright/test";
import { SearchConsumerApi } from "../Api/consumersearch.api";
import { DtrSearchApi } from "../Api/dtrsearch.api";
import { NetworkSearchApi } from "../Api/networksearch.api";
import { OrganizationApi } from "../Api/searchorganization.api";
import { ConnectionStatusApi } from "../Api/connectionstatus.api";
import { ConsumerCategoryApi } from "../Api/consumercategory.api";
import { DeviceManufacturerApi } from "../Api/devicemanufacturer.api";
import { EventApi } from "../Api/eventapi";
import { EventClassificationApi } from "../Api/eventclassification.api";
import { EventPriorityApi } from "../Api/eventpriority.api";
import { MeterPhaseApi } from "../Api/meterphase.api";
import { PaymentContractApi } from "../Api/paymentcontract.api";
import { NetworkApi } from "../Api/networkhierarchy.api";
import { OrganisationApi } from "../Api/organizationhierarchy.api";

export type UtilsLookupContractKind = "grid" | "items";

export interface UtilsLookupContractFetchResult {
  rawResponse: APIResponse;
  responseBody: unknown;
  responseTime: number;
}

export interface UtilsLookupContractCase {
  testCaseId: string;
  testName: string;
  snapshotName: string;
  pathPattern: string;
  kind: UtilsLookupContractKind;
  tags: string[];
  fetch: (
    api: APIRequestContext,
  ) => Promise<UtilsLookupContractFetchResult>; /** Smoke: primary list/table must be non-empty. */
  nonEmptyExpected?: boolean;
}

/**
 * All 14 live UTILS-LOOKUP endpoints for contract snapshots.
 * Missing-route probes (404) are intentionally excluded.
 */
export const utilsLookupContractCases: UtilsLookupContractCase[] = [
  {
    testCaseId: "IND-UL-CONTRACT-001",
    testName: "Consumer search — column and field names stay the same",
    snapshotName: "utils-lookup/consumer-search",
    pathPattern: SearchConsumerApi.PATH,
    kind: "grid",
    tags: ["@utils-lookup", "@contract-snapshot", "@consumer-search"],
    nonEmptyExpected: false,
    fetch: (api) => new SearchConsumerApi(api).searchConsumers({ page: 1, limit: 20 }),
  },
  {
    testCaseId: "IND-UL-CONTRACT-002",
    testName: "DTR search — column and field names stay the same",
    snapshotName: "utils-lookup/dtr-search",
    pathPattern: DtrSearchApi.PATH,
    kind: "grid",
    tags: ["@utils-lookup", "@contract-snapshot", "@dtr-search"],
    nonEmptyExpected: false,
    fetch: (api) => new DtrSearchApi(api).searchDtr({ page: 1, limit: 20 }),
  },
  {
    testCaseId: "IND-UL-CONTRACT-003",
    testName: "Network search — field names stay the same",
    snapshotName: "utils-lookup/network-search",
    pathPattern: NetworkSearchApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@network-search"],
    nonEmptyExpected: false,
    fetch: (api) => new NetworkSearchApi(api).searchNetworks({ limit: 20 }),
  },
  {
    testCaseId: "IND-UL-CONTRACT-004",
    testName: "Organisation search — field names stay the same",
    snapshotName: "utils-lookup/organisation-search",
    pathPattern: OrganizationApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@organisation-search"],
    nonEmptyExpected: false,
    fetch: (api) => new OrganizationApi(api).searchOrganizations({ limit: 20 }),
  },
  {
    testCaseId: "IND-UL-CONTRACT-005",
    testName: "Connection statuses — field names stay the same",
    snapshotName: "utils-lookup/connection-statuses",
    pathPattern: ConnectionStatusApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@connection-status"],
    nonEmptyExpected: false,
    fetch: (api) => new ConnectionStatusApi(api).getConnectionStatuses(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-006",
    testName: "Consumer categories — field names stay the same",
    snapshotName: "utils-lookup/consumer-categories",
    pathPattern: ConsumerCategoryApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@consumer-category"],
    nonEmptyExpected: false,
    fetch: (api) => new ConsumerCategoryApi(api).getConsumerCategories(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-007",
    testName: "Device manufacturers — field names stay the same",
    snapshotName: "utils-lookup/device-manufacturers",
    pathPattern: DeviceManufacturerApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@device-manufacturer"],
    nonEmptyExpected: false,
    fetch: (api) => new DeviceManufacturerApi(api).getDeviceManufacturers(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-008",
    testName: "Events — field names stay the same",
    snapshotName: "utils-lookup/events",
    pathPattern: EventApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@events"],
    nonEmptyExpected: false,
    fetch: (api) => new EventApi(api).getEvents(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-009",
    testName: "Event classifications — field names stay the same",
    snapshotName: "utils-lookup/event-classifications",
    pathPattern: EventClassificationApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@event-classification"],
    nonEmptyExpected: false,
    fetch: (api) => new EventClassificationApi(api).getEventClassifications(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-010",
    testName: "Event priorities — field names stay the same",
    snapshotName: "utils-lookup/event-priorities",
    pathPattern: EventPriorityApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@event-priority"],
    nonEmptyExpected: false,
    fetch: (api) => new EventPriorityApi(api).getEventPriorities(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-011",
    testName: "Meter phases — field names stay the same",
    snapshotName: "utils-lookup/meter-phases",
    pathPattern: MeterPhaseApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@meter-phase"],
    nonEmptyExpected: false,
    fetch: (api) => new MeterPhaseApi(api).getMeterPhases(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-012",
    testName: "Payment contracts — field names stay the same",
    snapshotName: "utils-lookup/payment-contracts",
    pathPattern: PaymentContractApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@payment-contract"],
    nonEmptyExpected: false,
    fetch: (api) => new PaymentContractApi(api).getPaymentContracts(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-013",
    testName: "Network hierarchy — field names stay the same",
    snapshotName: "utils-lookup/network-hierarchy",
    pathPattern: NetworkApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@network-hierarchy"],
    nonEmptyExpected: false,
    fetch: (api) => new NetworkApi(api).getNetworkHierarchy(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-014",
    testName: "Organisation hierarchy — field names stay the same",
    snapshotName: "utils-lookup/organisation-hierarchy",
    pathPattern: OrganisationApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@organisation-hierarchy"],
    nonEmptyExpected: false,
    fetch: (api) => new OrganisationApi(api).getOrganisationHierarchy(),
  },
];
