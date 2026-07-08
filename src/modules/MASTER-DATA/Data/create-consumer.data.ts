import type { APIRequestContext } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import { MASTER_DATA_MAX_RESPONSE_TIME_MS } from "../../../core/constants/api-timeouts";
import type { CreateConsumerScenario } from "../Mapper/create-consumer.mapper";
import {
  hasConsumerAssignableMeterPool,
  nextConsumerAssignableMeterSerial,
  peekConsumerAssignableMeterSerial,
} from "../../CONSUMERS/Data/consumer-assignable-meter-pool.data";
import type { NetworkNode } from "../../ASSET-MANAGEMENT/Mapper/networkhierarchy.mapper";
import type { OrganisationNode } from "../../ASSET-MANAGEMENT/Mapper/organizationhierarchy.mapper";
import {
  resolveMasterDataEnv as envValue,
  resolveMasterDataEnvInt,
} from "../utils/master-data-env.helper";
import {
  getBillingCycleId,
  getConnectionStatusId,
  getConnectionTypeId,
  getConsumerCategoryId,
  getMainSubMeterId,
  getMeterPhaseId,
  getTodId,
} from "../utils/consumer-lookup.helper";
import {
  ensureNetworkHierarchyCascadeContext,
  getCascadeDtrName,
  getCascadeFeederName,
  getCascadeSubStationName,
  getCascadeZoneName,
  getNetworkHierarchyCascade,
} from "../utils/network-hierarchy-cascade.helper";
import { getConsumerBulkMasterHierarchyLabels } from "../utils/consumer-bulk-hierarchy.helper";
import { getValidateMeterSerial } from "../utils/validate-meter-runtime.helper";

export type { ConsumerBulkHierarchyLabels } from "../utils/network-hierarchy-cascade.helper";
export {
  ensureConsumerBulkHierarchyContext,
  getConsumerBulkHierarchyLabels,
  hasConsumerBulkHierarchyLabels,
} from "../utils/network-hierarchy-cascade.helper";

export type CreateConsumerRequestBody = Record<string, string | number | boolean>;

export const createConsumerMaxResponseTimeMs = MASTER_DATA_MAX_RESPONSE_TIME_MS;

export const createConsumerExpectedSuccessMessage =
  "Consumer created successfully";

export const CREATE_CONSUMER_HIERARCHY_ENV_KEYS = [
  "BULK_DTR_ZONE_NAME",
  "BULK_DTR_SUBSTATION_NAME",
  "BULK_DTR_FEEDER_NAME",
] as const;

export const createConsumerData = {
  maxResponseTime: createConsumerMaxResponseTimeMs,
  expectedSuccessMessage: createConsumerExpectedSuccessMessage,
  organisationLookupId: resolveMasterDataEnvInt(
    "CREATE_CONSUMER_ORGANISATION_LOOKUP_ID",
    0,
  ),
  get connectionTypeId() {
    return getConnectionTypeId();
  },
  get consumerCategoryId() {
    return getConsumerCategoryId();
  },
  get connectionStatusId() {
    return getConnectionStatusId();
  },
  get mainSubMeterId() {
    return getMainSubMeterId();
  },
  get meterPhaseId() {
    return getMeterPhaseId();
  },
  get billingCycleId() {
    return getBillingCycleId();
  },
  get todId() {
    return getTodId();
  },
  profileQuery: {
    billingLimit: 12,
    eventPage: 1,
    eventPageSize: 20,
  },
};

export interface CreateConsumerTestCase {
  testName: string;
  scenario: CreateConsumerScenario;
  expectedStatus: number;
  acceptableStatuses?: number[];
  buildPayload: () => CreateConsumerRequestBody;
  envKeys?: string[];
  validationField?: string;
  tags: string[];
}

function uniqueSuffix(): string {
  return String(Date.now());
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function uniqueConsumerId(): string {
  return `CID-AUTO-${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function tenDigitMobile(): string {
  return `98${String(Date.now()).slice(-8)}`;
}

function subStationName(): string {
  return getCascadeSubStationName();
}

function feederName(): string {
  return getCascadeFeederName();
}

function dtrName(): string {
  return (
    getCascadeDtrName() ||
    envValue("BULK_CONSUMER_DTR_NAME") ||
    envValue("CREATE_DTR_EXISTS_CODE") ||
    ""
  );
}

function peekMeterSerial(): string {
  const provisioned = peekConsumerAssignableMeterSerial();
  if (provisioned) {
    return provisioned;
  }
  return envValue("BULK_CONSUMER_METER_SERIAL") || "MSN_INVALID_NONEXISTENT_00000";
}

function nextMeterSerial(): string {
  const provisioned = nextConsumerAssignableMeterSerial();
  if (provisioned) {
    return provisioned;
  }
  return peekMeterSerial();
}

export function hasCreateConsumerMeterPool(): boolean {
  return hasConsumerAssignableMeterPool();
}

export interface CreateConsumerMeterContext {
  organisationLookupId: number;
  networkLookupId: number;
  meterLookupId?: number;
  zone?: string;
  subStation?: string;
  feeder?: string;
  dtr?: string;
}

let meterContextCache: CreateConsumerMeterContext | null = null;

export function setCreateConsumerMeterContext(
  context: CreateConsumerMeterContext | null,
): void {
  meterContextCache = context;
}

export function getCreateConsumerMeterContext(): CreateConsumerMeterContext | null {
  return meterContextCache;
}

export function hasCreateConsumerMeterContext(): boolean {
  return meterContextCache != null;
}

/** Shared hierarchy labels for POST /indore/consumers and bulk-upload-consumers rows. */
export function getConsumerHierarchyLabels(): {
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;
} {
  const fromMaster = getConsumerBulkMasterHierarchyLabels();
  if (fromMaster) {
    return fromMaster;
  }
  const meterContext = getCreateConsumerMeterContext();
  return {
    zone: meterContext?.zone ?? getCascadeZoneName(),
    subStation: meterContext?.subStation ?? getCascadeSubStationName(),
    feeder: meterContext?.feeder ?? getCascadeFeederName(),
    dtr: meterContext?.dtr ?? getCascadeDtrName(),
  };
}

type HierarchyLabels = Pick<
  CreateConsumerMeterContext,
  "networkLookupId" | "zone" | "subStation" | "feeder" | "dtr"
> & {
  subStation?: string;
  feeder?: string;
};

function findDtrHierarchyContext(
  nodes: NetworkNode[],
  dtrCode: string,
  options?: { allowEnvFallback?: boolean },
): HierarchyLabels | null {
  const target = dtrCode.trim().toLowerCase();
  if (!target) {
    return null;
  }

  const walk = (
    items: NetworkNode[],
    ancestors: NetworkNode[],
  ): HierarchyLabels | null => {
    for (const node of items) {
      const chain = [...ancestors, node];
      for (const dtr of node.dtrs ?? []) {
        const code = String(dtr.dtrCode ?? "").trim().toLowerCase();
        const name = String(dtr.dtrName ?? "").trim().toLowerCase();
        if (code === target || name === target) {
          return hierarchyLabelsFromChain(chain, dtr, options);
        }
      }
      const childMatch = walk(node.children ?? [], chain);
      if (childMatch) {
        return childMatch;
      }
    }
    return null;
  };

  return walk(nodes, []);
}

function hierarchyLabelsFromChain(
  chain: NetworkNode[],
  dtr: { networkLookupId: number; dtrCode: string; dtrName: string },
  options?: { allowEnvFallback?: boolean },
): HierarchyLabels | null {
  const allowEnvFallback = options?.allowEnvFallback ?? true;
  const zone = [...chain]
    .reverse()
    .find((n) => /zone/i.test(n.hierarchyLevel))?.networkName;
  const subStation = [...chain]
    .reverse()
    .find((n) => /sub.?station/i.test(n.hierarchyLevel))?.networkName;
  const feeder = [...chain]
    .reverse()
    .find((n) => /feeder/i.test(n.hierarchyLevel))?.networkName;

  if (!allowEnvFallback && (!subStation?.trim() || !feeder?.trim())) {
    return null;
  }

  return {
    networkLookupId: dtr.networkLookupId,
    zone,
    subStation: subStation ?? (allowEnvFallback ? subStationName() : undefined),
    feeder: feeder ?? (allowEnvFallback ? feederName() : undefined),
    dtr: dtr.dtrCode || dtr.dtrName,
  };
}

function findDtrHierarchyByNetworkLookupId(
  nodes: NetworkNode[],
  networkLookupId: number,
  options?: { allowEnvFallback?: boolean },
): HierarchyLabels | null {
  const walk = (
    items: NetworkNode[],
    ancestors: NetworkNode[],
  ): HierarchyLabels | null => {
    for (const node of items) {
      const chain = [...ancestors, node];
      for (const dtr of node.dtrs ?? []) {
        if (dtr.networkLookupId === networkLookupId) {
          return hierarchyLabelsFromChain(chain, dtr, options);
        }
      }
      const childMatch = walk(node.children ?? [], chain);
      if (childMatch) {
        return childMatch;
      }
    }
    return null;
  };

  return walk(nodes, []);
}

async function fetchNetworkHierarchy(
  authenticatedApi: APIRequestContext,
): Promise<NetworkNode[]> {
  const response = await getWithAutoRefresh(
    authenticatedApi,
    "/indore/asset-management/network-hierarchy",
  );
  if (!response.ok()) {
    return [];
  }
  const body = (await response.json()) as {
    success?: boolean;
    data?: { hierarchy?: NetworkNode[] };
  };
  if (body.success !== true) {
    return [];
  }
  return body.data?.hierarchy ?? [];
}

/** Resolves DTR networkLookupId and aligned hierarchy labels for create-consumer payload. */
export async function resolveCreateConsumerDtrNetworkLookupId(
  authenticatedApi: APIRequestContext,
): Promise<number | null> {
  const context = await resolveCreateConsumerDtrHierarchyContext(authenticatedApi);
  return context?.networkLookupId ?? null;
}

export async function resolveCreateConsumerDtrHierarchyContext(
  authenticatedApi: APIRequestContext,
): Promise<Pick<
  CreateConsumerMeterContext,
  "networkLookupId" | "subStation" | "feeder" | "dtr"
> | null> {
  const fromEnv = envValue("CREATE_CONSUMER_NETWORK_LOOKUP_ID");
  if (fromEnv) {
    const parsed = Number(fromEnv);
    if (Number.isFinite(parsed) && parsed > 0) {
      const cascade = getNetworkHierarchyCascade();
      return {
        networkLookupId: parsed,
        subStation: cascade?.subStation ?? subStationName(),
        feeder: cascade?.feeder ?? feederName(),
        dtr: cascade?.dtr ?? dtrName(),
      };
    }
  }

  const cascade = await ensureNetworkHierarchyCascadeContext(authenticatedApi);
  if (cascade) {
    return {
      networkLookupId: cascade.dtrNetworkLookupId,
      subStation: cascade.subStation,
      feeder: cascade.feeder,
      dtr: cascade.dtr,
    };
  }

  const hierarchy = await fetchNetworkHierarchy(authenticatedApi);
  const code = dtrName();
  if (!code) {
    return null;
  }
  return findDtrHierarchyContext(hierarchy, code);
}

async function fetchOrganisationHierarchy(
  authenticatedApi: APIRequestContext,
): Promise<OrganisationNode[]> {
  const response = await getWithAutoRefresh(
    authenticatedApi,
    "/indore/asset-management/organisation-hierarchy",
  );
  if (!response.ok()) {
    return [];
  }
  const body = (await response.json()) as {
    success?: boolean;
    data?: { hierarchy?: OrganisationNode[] };
  };
  if (body.success !== true) {
    return [];
  }
  return body.data?.hierarchy ?? [];
}

function findDtrInOrganisationHierarchy(
  nodes: OrganisationNode[],
  dtrCode: string,
  organisationLookupId?: number,
): {
  networkLookupId: number;
  organisationLookupId: number;
  dtr: string;
} | null {
  const target = dtrCode.trim().toLowerCase();
  if (!target) {
    return null;
  }

  const walk = (items: OrganisationNode[]): {
    networkLookupId: number;
    organisationLookupId: number;
    dtr: string;
  } | null => {
    for (const node of items) {
      for (const dtr of node.dtrs ?? []) {
        const code = String(dtr.dtrCode ?? "").trim().toLowerCase();
        const name = String(dtr.dtrName ?? "").trim().toLowerCase();
        if (code === target || name === target) {
          if (
            organisationLookupId != null &&
            node.organisationLookupId !== organisationLookupId
          ) {
            continue;
          }
          return {
            networkLookupId: dtr.networkLookupId,
            organisationLookupId: node.organisationLookupId,
            dtr: dtr.dtrCode || dtr.dtrName,
          };
        }
      }
      const childMatch = walk(node.children ?? []);
      if (childMatch) {
        return childMatch;
      }
    }
    return null;
  };

  return walk(nodes);
}

export async function resolveCreateConsumerMeterContext(
  authenticatedApi: APIRequestContext,
  organisationLookupId: number,
): Promise<CreateConsumerMeterContext | null> {
  const preferredDtr = dtrName();
  const orgHierarchy = await fetchOrganisationHierarchy(authenticatedApi);
  let resolvedDtr = preferredDtr
    ? findDtrInOrganisationHierarchy(
        orgHierarchy,
        preferredDtr,
        organisationLookupId,
      )
    : null;
  if (!resolvedDtr && preferredDtr) {
    resolvedDtr = findDtrInOrganisationHierarchy(orgHierarchy, preferredDtr);
  }

  if (resolvedDtr?.networkLookupId) {
    const cascade = await ensureNetworkHierarchyCascadeContext(
      authenticatedApi,
      { dtrNetworkLookupId: resolvedDtr.networkLookupId },
    );
    if (cascade) {
      return {
        organisationLookupId: resolvedDtr.organisationLookupId,
        networkLookupId: cascade.dtrNetworkLookupId,
        subStation: cascade.subStation,
        feeder: cascade.feeder,
        dtr: cascade.dtr,
        zone: cascade.zone,
      };
    }

    const networkHierarchy = await fetchNetworkHierarchy(authenticatedApi);
    const labels = findDtrHierarchyByNetworkLookupId(
      networkHierarchy,
      resolvedDtr.networkLookupId,
      { allowEnvFallback: false },
    );
    if (labels?.subStation && labels.feeder) {
      return {
        organisationLookupId: resolvedDtr.organisationLookupId,
        networkLookupId: resolvedDtr.networkLookupId,
        subStation: labels.subStation,
        feeder: labels.feeder,
        dtr: labels.dtr ?? resolvedDtr.dtr,
        zone: labels.zone,
      };
    }
  }

  const cascade = await ensureNetworkHierarchyCascadeContext(authenticatedApi);
  if (!cascade) {
    return null;
  }

  return {
    organisationLookupId:
      resolvedDtr?.organisationLookupId ??
      cascade.organisationLookupId ??
      organisationLookupId,
    networkLookupId: cascade.dtrNetworkLookupId,
    subStation: cascade.subStation,
    feeder: cascade.feeder,
    dtr: cascade.dtr,
    zone: cascade.zone,
  };
}

let nearestAcctIdCache: string | null = null;

export function setBulkConsumerNearestAcctId(id: string): void {
  nearestAcctIdCache = id.trim() || null;
}

export function nearestAcctId(): string {
  return (
    envValue("BULK_CONSUMER_NEAREST_ACCT_ID") ||
    nearestAcctIdCache ||
    envValue("CONSUMER_NUMBER") ||
    ""
  );
}

export function hasBulkConsumerNearestAcctId(): boolean {
  return nearestAcctId().trim().length > 0;
}

let existingConsumerCidCache: string | null = null;

export function setBulkConsumerExistingCid(cid: string): void {
  existingConsumerCidCache = cid.trim() || null;
}

export function existingConsumerCid(): string {
  return envValue("BULK_CONSUMER_EXISTS_CID") || existingConsumerCidCache || "";
}

export function hasBulkConsumerExistingCid(): boolean {
  return existingConsumerCid().trim().length > 0;
}

async function fetchConsumerMasterRows(
  authenticatedApi: APIRequestContext,
  limit = 20,
): Promise<Array<Record<string, unknown>>> {
  const response = await getWithAutoRefresh(
    authenticatedApi,
    "/indore/master-data/consumer-master-data",
    { params: { page: 1, limit, meterType: "all" } },
  );
  if (!response.ok()) {
    return [];
  }
  const body = (await response.json()) as {
    data?: {
      rows?: Array<Record<string, unknown>>;
      items?: Array<Record<string, unknown>>;
    };
  };
  return body.data?.rows ?? body.data?.items ?? [];
}

function extractConsumerCid(row: Record<string, unknown>): string | null {
  const raw = row.consumerCid ?? row["Consumer ID"];
  if (raw == null) {
    return null;
  }
  const cid = String(raw).trim();
  return cid.length > 0 ? cid : null;
}

export async function ensureBulkConsumerExistingCid(
  authenticatedApi: APIRequestContext,
): Promise<string | null> {
  const fromEnv = envValue("BULK_CONSUMER_EXISTS_CID");
  if (fromEnv) {
    setBulkConsumerExistingCid(fromEnv);
    return fromEnv;
  }
  if (existingConsumerCidCache) {
    return existingConsumerCidCache;
  }

  const rows = await fetchConsumerMasterRows(authenticatedApi, 25);
  for (const row of rows) {
    const cid = extractConsumerCid(row);
    if (cid) {
      setBulkConsumerExistingCid(cid);
      return cid;
    }
  }
  return null;
}

async function fetchValidNearestAccountId(
  authenticatedApi: APIRequestContext,
  accountId: string,
): Promise<string | null> {
  const trimmed = accountId.trim();
  if (!trimmed) {
    return null;
  }

  const candidates = [
    trimmed,
    trimmed.startsWith("N") ? trimmed.slice(1) : `N${trimmed}`,
  ].filter((value, index, list) => list.indexOf(value) === index);

  for (const candidate of candidates) {
    const response = await getWithAutoRefresh(
      authenticatedApi,
      "/indore/consumers/nearest-account-ids",
      { params: { accountId: candidate } },
    );
    if (!response.ok()) {
      continue;
    }
    const body = (await response.json()) as {
      success?: boolean;
      data?: unknown;
    };
    if (body.success !== true) {
      continue;
    }

    if (typeof body.data === "string" && body.data.trim()) {
      return body.data.trim();
    }
    if (body.data && typeof body.data === "object") {
      const record = body.data as Record<string, unknown>;
      for (const key of [
        "accountId",
        "nearestAccountId",
        "nearestAcctId",
        "ivrsNumber",
      ]) {
        const value = record[key];
        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
      }
    }

    return candidate;
  }

  return null;
}

async function resolveNearestAccountIdFromMasterData(
  authenticatedApi: APIRequestContext,
): Promise<string | null> {
  const rows = await fetchConsumerMasterRows(authenticatedApi, 20);
  for (const row of rows) {
    const candidates = [
      row.ivrsNo,
      row.existingIvrsNo,
      row.consumerCid,
      row.accountId,
      row["Account ID"],
    ]
      .map((value) => (value == null ? "" : String(value).trim()))
      .filter(Boolean);
    for (const candidate of candidates) {
      const resolved = await fetchValidNearestAccountId(
        authenticatedApi,
        candidate,
      );
      if (resolved) {
        return resolved;
      }
    }
  }
  return null;
}

export async function ensureBulkConsumerNearestAcctId(
  authenticatedApi: APIRequestContext,
): Promise<string | null> {
  const fromEnv = envValue("BULK_CONSUMER_NEAREST_ACCT_ID");
  if (fromEnv) {
    const resolved = await fetchValidNearestAccountId(authenticatedApi, fromEnv);
    if (resolved) {
      setBulkConsumerNearestAcctId(resolved);
      return resolved;
    }
  }
  if (nearestAcctIdCache) {
    return nearestAcctIdCache;
  }
  const consumerNumber = envValue("CONSUMER_NUMBER");
  if (consumerNumber) {
    const resolved = await fetchValidNearestAccountId(
      authenticatedApi,
      consumerNumber,
    );
    if (resolved) {
      setBulkConsumerNearestAcctId(resolved);
      return resolved;
    }
  }

  const resolved = await resolveNearestAccountIdFromMasterData(authenticatedApi);
  if (resolved) {
    setBulkConsumerNearestAcctId(resolved);
  }
  return resolved;
}

export function buildValidCreateConsumerRequest(options?: {
  label?: string;
  consumerId?: string;
  ivrsNumber?: string;
  accountId?: string;
  nearestAcctId?: string;
  meterSerial?: string;
  allocateMeter?: boolean;
}): CreateConsumerRequestBody {
  const today = isoToday();
  const label = options?.label ?? uniqueSuffix();
  const stamp = String(Date.now()).slice(-8);
  const consumerId = options?.consumerId ?? uniqueConsumerId();
  const meterSerial =
    options?.meterSerial ??
    (options?.allocateMeter ? nextMeterSerial() : peekMeterSerial());
  const meterContext = getCreateConsumerMeterContext();
  const cascade = getNetworkHierarchyCascade();
  const hierarchy = getConsumerHierarchyLabels();

  return {
    ...(meterContext
      ? {
          organisationLookupId: meterContext.organisationLookupId,
          networkLookupId: meterContext.networkLookupId,
          ...(meterContext.meterLookupId
            ? { meterLookupId: meterContext.meterLookupId }
            : {}),
          "Organisation Lookup ID": meterContext.organisationLookupId,
          ...(meterContext.meterLookupId
            ? { "Meter Lookup ID": meterContext.meterLookupId }
            : {}),
        }
      : cascade
        ? {
            organisationLookupId:
              cascade.organisationLookupId ??
              createConsumerData.organisationLookupId,
            networkLookupId: cascade.dtrNetworkLookupId,
            "Organisation Lookup ID":
              cascade.organisationLookupId ??
              createConsumerData.organisationLookupId,
          }
        : {
            organisationLookupId: createConsumerData.organisationLookupId,
            "Organisation Lookup ID": createConsumerData.organisationLookupId,
          }),
    ...(cascade
      ? {
          subStationNetworkLookupId: cascade.subStationNetworkLookupId,
          feederNetworkLookupId: cascade.feederNetworkLookupId,
        }
      : {}),
    "Consumer ID": consumerId,
    "Consumer Name": `Auto Consumer ${label}`,
    "Father Name": "Suresh Kumar",
    "Email ID": `auto.${label}@example.com`,
    "Mobile No.": tenDigitMobile(),
    "Land Line No.": "07312551234",
    Address: "12 MG Road, Indore",
    "Pin Code": "452001",
    "Sub Station": hierarchy.subStation,
    Feeder: hierarchy.feeder,
    DTR: hierarchy.dtr,
    "IVRS Number": options?.ivrsNumber ?? consumerId,
    "Account ID": options?.accountId ?? consumerId,
    "Nearest Acct. ID": options?.nearestAcctId ?? nearestAcctId(),
    "Total Demand (KVA)": 5,
    "Sanctioned Load (KW)": 4,
    "Sanctioned Load (HP)": 5.5,
    "Connected KVA": 4,
    "Connected KW": 3.5,
    "Connected HP": 4.5,
    "Rated KVA": 5,
    "Rated KW": 4,
    "Connection Type": createConsumerData.connectionTypeId,
    "Billing Cycle": createConsumerData.billingCycleId,
    "Bill Day": 5,
    "Consumer Category": createConsumerData.consumerCategoryId,
    "Nature Of Business": "Commercial",
    "Connection Status": createConsumerData.connectionStatusId,
    TOD: createConsumerData.todId,
    "MR Code": "MR01",
    "Main/Sub Meter": createConsumerData.mainSubMeterId,
    MSN: meterSerial,
    "Service Point ID": `SP${stamp}`,
    "Date Of Service": today,
    "Meter Phase": createConsumerData.meterPhaseId,
    "Connected To DCU": true,
    "SIM No.": "9900000001",
    "IMSI No.": "404010123456789",
    "Mobile No. (Meter)": "9876501234",
    "IP Address": "192.168.1.100",
    "Modem Serial Number": `MOD${stamp}`,
    "Modem IMEI": "359072069367200",
    "Meter Initial Reading": 1,
    "Is Net Meter": false,
    "Connected Phase": "R",
    "Activate/Deactivate Remarks": "Automation create-consumer",
  };
}

/** @deprecated Use buildValidCreateConsumerRequest */
export function buildCreateConsumerRequest(
  suffix: string = String(Date.now()),
): CreateConsumerRequestBody {
  return buildValidCreateConsumerRequest({ label: suffix, allocateMeter: true });
}

const hierarchyEnvKeys = [...CREATE_CONSUMER_HIERARCHY_ENV_KEYS];
const invalidLookupId = 99999;

export const createConsumerTestCases: CreateConsumerTestCase[] = [
  {
    testName: "Validate POST /indore/consumers — create consumer success",
    scenario: "create_success",
    expectedStatus: 201,
    envKeys: hierarchyEnvKeys,
    buildPayload: () =>
      buildValidCreateConsumerRequest({
        label: "success",
        allocateMeter: true,
      }),
    tags: ["@master-data", "@create-consumer", "@positive", "@smoke"],
  },
  {
    testName: "Validate POST /indore/consumers — Consumer ID required",
    scenario: "missing_consumer_id",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Consumer ID",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "no-cid" }),
      "Consumer ID": "",
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Nearest Account ID required",
    scenario: "missing_nearest_acct_id",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Nearest Acct. ID",
    buildPayload: () =>
      buildValidCreateConsumerRequest({
        label: "no-nearest",
        nearestAcctId: "",
      }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Nearest Account ID must be valid",
    scenario: "invalid_nearest_acct_id",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Nearest Acct. ID",
    buildPayload: () =>
      buildValidCreateConsumerRequest({
        label: "bad-nearest",
        nearestAcctId: "NEAREST_INVALID_XXXX",
      }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — existing Consumer ID rejected",
    scenario: "consumer_id_exists",
    expectedStatus: 400,
    acceptableStatuses: [400, 409],
    envKeys: hierarchyEnvKeys,
    buildPayload: () =>
      buildValidCreateConsumerRequest({
        label: "exists",
        consumerId: existingConsumerCid(),
      }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Bill Day must be between 1 and 28 (above range)",
    scenario: "invalid_bill_day",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Bill Day",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-bill-day-high" }),
      "Bill Day": 31,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Bill Day must be between 1 and 28 (below range)",
    scenario: "invalid_bill_day_zero",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Bill Day",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-bill-day-zero" }),
      "Bill Day": 0,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Consumer Category must be valid",
    scenario: "invalid_consumer_category",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Consumer Category",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-category" }),
      "Consumer Category": invalidLookupId,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Billing Cycle must be valid",
    scenario: "invalid_billing_cycle",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Billing Cycle",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-billing" }),
      "Billing Cycle": invalidLookupId,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Connection Type must be valid",
    scenario: "invalid_connection_type",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Connection Type",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-conn-type" }),
      "Connection Type": invalidLookupId,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Connection Status must be valid",
    scenario: "invalid_connection_status",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Connection Status",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-conn-status" }),
      "Connection Status": invalidLookupId,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName: "Validate POST /indore/consumers — TOD must be valid",
    scenario: "invalid_tod",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "TOD",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-tod" }),
      TOD: invalidLookupId,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Sub Station must belong to hierarchy",
    scenario: "invalid_substation",
    expectedStatus: 400,
    envKeys: ["BULK_DTR_ZONE_NAME", "BULK_DTR_FEEDER_NAME"],
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-ss" }),
      "Sub Station": "SS_INVALID_XXXX",
      subStationNetworkLookupId: invalidLookupId,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Feeder must belong to hierarchy",
    scenario: "invalid_feeder",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-feeder" }),
      Feeder: "FEEDER_INVALID_XXXX",
      feederNetworkLookupId: invalidLookupId,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName: "Validate POST /indore/consumers — DTR must be valid",
    scenario: "invalid_dtr",
    expectedStatus: 400,
    envKeys: [
      "BULK_DTR_ZONE_NAME",
      "BULK_DTR_SUBSTATION_NAME",
      "BULK_DTR_FEEDER_NAME",
    ],
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-dtr" }),
      DTR: "DTR_INVALID_XXXX",
      networkLookupId: invalidLookupId,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName: "Validate POST /indore/consumers — MSN required",
    scenario: "missing_msn",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "MSN",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "no-msn" }),
      MSN: "",
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName: "Validate POST /indore/consumers — meter must exist",
    scenario: "meter_not_found",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildPayload: () =>
      buildValidCreateConsumerRequest({
        label: "msn-missing",
        meterSerial: `Z${Date.now().toString().slice(-11)}`,
      }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName: "Validate POST /indore/consumers — meter must be active",
    scenario: "meter_inactive",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    buildPayload: () =>
      buildValidCreateConsumerRequest({
        label: "msn-inactive",
        meterSerial: getValidateMeterSerial("VALIDATE_DTR_METER_INACTIVE_SERIAL"),
      }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — meter must not already be mapped",
    scenario: "meter_already_mapped",
    expectedStatus: 400,
    acceptableStatuses: [400, 409],
    envKeys: hierarchyEnvKeys,
    buildPayload: () =>
      buildValidCreateConsumerRequest({
        label: "msn-mapped",
        meterSerial: getValidateMeterSerial("VALIDATE_DTR_METER_ASSIGNED_SERIAL"),
      }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Main/Sub Meter must be valid",
    scenario: "invalid_main_sub_meter",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Main/Sub Meter",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-main-sub" }),
      "Main/Sub Meter": invalidLookupId,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName: "Validate POST /indore/consumers — Meter Phase must be valid",
    scenario: "invalid_meter_phase",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Meter Phase",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-phase" }),
      "Meter Phase": invalidLookupId,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Service Point ID mandatory",
    scenario: "missing_service_point",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Service Point ID",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "no-sp" }),
      "Service Point ID": "",
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Meter Initial Reading must be greater than 0",
    scenario: "reading_zero",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Meter Initial Reading",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "reading-zero" }),
      "Meter Initial Reading": 0,
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName: "Validate POST /indore/consumers — SIM Number mandatory",
    scenario: "missing_sim",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "SIM No.",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "no-sim" }),
      "SIM No.": "",
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName: "Validate POST /indore/consumers — IMSI must be numeric",
    scenario: "invalid_imsi",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "IMSI No.",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-imsi" }),
      "IMSI No.": "IMSI-ABC-XYZ",
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Meter Mobile Number must be 10 digits",
    scenario: "invalid_meter_mobile",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Mobile No. (Meter)",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-meter-mobile" }),
      "Mobile No. (Meter)": "12345",
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName: "Validate POST /indore/consumers — IP Address must be valid",
    scenario: "invalid_ip",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "IP Address",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "bad-ip" }),
      "IP Address": "not-an-ip",
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
  {
    testName:
      "Validate POST /indore/consumers — Modem Serial Number mandatory",
    scenario: "missing_modem_serial",
    expectedStatus: 400,
    envKeys: hierarchyEnvKeys,
    validationField: "Modem Serial Number",
    buildPayload: () => ({
      ...buildValidCreateConsumerRequest({ label: "no-modem" }),
      "Modem Serial Number": "",
    }),
    tags: ["@master-data", "@create-consumer", "@negative"],
  },
];
