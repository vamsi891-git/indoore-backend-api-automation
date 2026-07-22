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
  fetch: (api: APIRequestContext) => Promise<UtilsLookupContractFetchResult>;
}

/**
 * All 14 live UTILS-LOOKUP endpoints for contract snapshots.
 * Missing-route probes (404) are intentionally excluded.
 */
export const utilsLookupContractCases: UtilsLookupContractCase[] = [
  {
    testCaseId: "IND-UL-CONTRACT-001",
    testName: "IND-UL-CONTRACT-001 — Consumer search contract snapshot",
    snapshotName: "utils-lookup/consumer-search",
    pathPattern: SearchConsumerApi.PATH,
    kind: "grid",
    tags: ["@utils-lookup", "@contract-snapshot", "@consumer-search"],
    fetch: (api) =>
      new SearchConsumerApi(api).searchConsumers({ page: 1, limit: 20 }),
  },
  {
    testCaseId: "IND-UL-CONTRACT-002",
    testName: "IND-UL-CONTRACT-002 — DTR search contract snapshot",
    snapshotName: "utils-lookup/dtr-search",
    pathPattern: DtrSearchApi.PATH,
    kind: "grid",
    tags: ["@utils-lookup", "@contract-snapshot", "@dtr-search"],
    fetch: (api) => new DtrSearchApi(api).searchDtr({ page: 1, limit: 20 }),
  },
  {
    testCaseId: "IND-UL-CONTRACT-003",
    testName: "IND-UL-CONTRACT-003 — Network search contract snapshot",
    snapshotName: "utils-lookup/network-search",
    pathPattern: NetworkSearchApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@network-search"],
    fetch: (api) => new NetworkSearchApi(api).searchNetworks({ limit: 20 }),
  },
  {
    testCaseId: "IND-UL-CONTRACT-004",
    testName: "IND-UL-CONTRACT-004 — Organisation search contract snapshot",
    snapshotName: "utils-lookup/organisation-search",
    pathPattern: OrganizationApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@organisation-search"],
    fetch: (api) =>
      new OrganizationApi(api).searchOrganizations({ limit: 20 }),
  },
  {
    testCaseId: "IND-UL-CONTRACT-005",
    testName: "IND-UL-CONTRACT-005 — Connection statuses contract snapshot",
    snapshotName: "utils-lookup/connection-statuses",
    pathPattern: ConnectionStatusApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@connection-status"],
    fetch: (api) => new ConnectionStatusApi(api).getConnectionStatuses(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-006",
    testName: "IND-UL-CONTRACT-006 — Consumer categories contract snapshot",
    snapshotName: "utils-lookup/consumer-categories",
    pathPattern: ConsumerCategoryApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@consumer-category"],
    fetch: (api) => new ConsumerCategoryApi(api).getConsumerCategories(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-007",
    testName: "IND-UL-CONTRACT-007 — Device manufacturers contract snapshot",
    snapshotName: "utils-lookup/device-manufacturers",
    pathPattern: DeviceManufacturerApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@device-manufacturer"],
    fetch: (api) => new DeviceManufacturerApi(api).getDeviceManufacturers(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-008",
    testName: "IND-UL-CONTRACT-008 — Events contract snapshot",
    snapshotName: "utils-lookup/events",
    pathPattern: EventApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@events"],
    fetch: (api) => new EventApi(api).getEvents(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-009",
    testName: "IND-UL-CONTRACT-009 — Event classifications contract snapshot",
    snapshotName: "utils-lookup/event-classifications",
    pathPattern: EventClassificationApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@event-classification"],
    fetch: (api) => new EventClassificationApi(api).getEventClassifications(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-010",
    testName: "IND-UL-CONTRACT-010 — Event priorities contract snapshot",
    snapshotName: "utils-lookup/event-priorities",
    pathPattern: EventPriorityApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@event-priority"],
    fetch: (api) => new EventPriorityApi(api).getEventPriorities(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-011",
    testName: "IND-UL-CONTRACT-011 — Meter phases contract snapshot",
    snapshotName: "utils-lookup/meter-phases",
    pathPattern: MeterPhaseApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@meter-phase"],
    fetch: (api) => new MeterPhaseApi(api).getMeterPhases(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-012",
    testName: "IND-UL-CONTRACT-012 — Payment contracts contract snapshot",
    snapshotName: "utils-lookup/payment-contracts",
    pathPattern: PaymentContractApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@payment-contract"],
    fetch: (api) => new PaymentContractApi(api).getPaymentContracts(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-013",
    testName: "IND-UL-CONTRACT-013 — Network hierarchy contract snapshot",
    snapshotName: "utils-lookup/network-hierarchy",
    pathPattern: NetworkApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@network-hierarchy"],
    fetch: (api) => new NetworkApi(api).getNetworkHierarchy(),
  },
  {
    testCaseId: "IND-UL-CONTRACT-014",
    testName: "IND-UL-CONTRACT-014 — Organisation hierarchy contract snapshot",
    snapshotName: "utils-lookup/organisation-hierarchy",
    pathPattern: OrganisationApi.PATH,
    kind: "items",
    tags: ["@utils-lookup", "@contract-snapshot", "@organisation-hierarchy"],
    fetch: (api) => new OrganisationApi(api).getOrganisationHierarchy(),
  },
];
