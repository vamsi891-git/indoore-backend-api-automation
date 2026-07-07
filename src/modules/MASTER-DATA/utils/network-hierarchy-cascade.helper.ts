import type { APIRequestContext } from "@playwright/test";
import { getWithAutoRefresh } from "../../../core/utils/authenticated.request";
import type { NetworkNode } from "../../ASSET-MANAGEMENT/Mapper/networkhierarchy.mapper";
import type { OrganisationNode } from "../../ASSET-MANAGEMENT/Mapper/organizationhierarchy.mapper";
import { resolveMasterDataEnv, resolveMasterDataEnvInt } from "./master-data-env.helper";

/** Cascading autoselect: Zone → Sub Station → Feeder → DTR (Bulk upload validations.txt). */
export interface NetworkHierarchyCascade {
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;
  subStationNetworkLookupId: number;
  feederNetworkLookupId: number;
  dtrNetworkLookupId: number;
  organisationLookupId?: number;
}

interface RawNetworkChain {
  subStation: string;
  feeder: string;
  dtr: string;
  subStationNetworkLookupId: number;
  feederNetworkLookupId: number;
  dtrNetworkLookupId: number;
}

interface CascadePreferences {
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;
  organisationLookupId?: number;
}

function defaultOrganisationLookupId(): number | undefined {
  const parsed = resolveMasterDataEnvInt("CREATE_CONSUMER_ORGANISATION_LOOKUP_ID", 0);
  return parsed > 0 ? parsed : undefined;
}

let cachedCascade: NetworkHierarchyCascade | null = null;
let ensurePromise: Promise<NetworkHierarchyCascade | null> | null = null;

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function matchesName(actual: string, preferred: string): boolean {
  if (!preferred.trim()) {
    return true;
  }
  return normalizeName(actual) === normalizeName(preferred);
}

function cascadePreferences(
  organisationLookupId?: number,
): CascadePreferences {
  return {
    zone: resolveMasterDataEnv("BULK_DTR_ZONE_NAME"),
    subStation: resolveMasterDataEnv("BULK_DTR_SUBSTATION_NAME"),
    feeder: resolveMasterDataEnv("BULK_DTR_FEEDER_NAME"),
    dtr:
      resolveMasterDataEnv("BULK_CONSUMER_DTR_NAME") ||
      resolveMasterDataEnv("CREATE_DTR_EXISTS_CODE"),
    organisationLookupId: organisationLookupId ?? defaultOrganisationLookupId(),
  };
}

function findLevelInChain(
  chain: NetworkNode[],
  pattern: RegExp,
): NetworkNode | undefined {
  return [...chain].reverse().find((node) => pattern.test(node.hierarchyLevel));
}

/** Collect valid Sub Station → Feeder → DTR paths from network hierarchy. */
function collectNetworkChains(nodes: NetworkNode[]): RawNetworkChain[] {
  const results: RawNetworkChain[] = [];

  const walk = (items: NetworkNode[], ancestors: NetworkNode[]) => {
    for (const node of items) {
      const chain = [...ancestors, node];
      const isFeeder = /feeder/i.test(node.hierarchyLevel);
      const subStationNode = findLevelInChain(chain, /sub.?station/i);

      if (isFeeder && subStationNode && (node.dtrs?.length ?? 0) > 0) {
        for (const dtr of node.dtrs ?? []) {
          const code = String(dtr.dtrCode || dtr.dtrName || "").trim();
          if (!code) {
            continue;
          }
          results.push({
            subStation: subStationNode.networkName,
            feeder: node.networkName,
            dtr: code,
            subStationNetworkLookupId: subStationNode.networkLookupId,
            feederNetworkLookupId: node.networkLookupId,
            dtrNetworkLookupId: dtr.networkLookupId,
          });
        }
      }

      walk(node.children ?? [], chain);
    }
  };

  walk(nodes, []);
  return results;
}

function findOrgZoneForDtrNetworkId(
  nodes: OrganisationNode[],
  dtrNetworkLookupId: number,
): { zone: string; organisationLookupId: number } | null {
  const walk = (
    items: OrganisationNode[],
    ancestors: OrganisationNode[],
  ): { zone: string; organisationLookupId: number } | null => {
    for (const node of items) {
      const chain = [...ancestors, node];
      for (const dtr of node.dtrs ?? []) {
        if (dtr.networkLookupId !== dtrNetworkLookupId) {
          continue;
        }
        const zoneNode = [...chain]
          .reverse()
          .find((org) => /^zone$/i.test(org.hierarchyLevel.trim()));
        const zone = zoneNode?.officeName?.trim();
        if (!zone) {
          return null;
        }
        return {
          zone,
          organisationLookupId:
            zoneNode?.organisationLookupId ?? node.organisationLookupId,
        };
      }
      const nested = walk(node.children ?? [], chain);
      if (nested) {
        return nested;
      }
    }
    return null;
  };

  return walk(nodes, []);
}

function scoreChain(
  chain: NetworkHierarchyCascade,
  prefs: CascadePreferences,
  options?: {
    preferredDtrNetworkLookupId?: number;
    networkAnchorLookupId?: number;
  },
): number {
  let score = 0;
  if (
    options?.preferredDtrNetworkLookupId != null &&
    chain.dtrNetworkLookupId === options.preferredDtrNetworkLookupId
  ) {
    score += 1000;
  }
  if (options?.networkAnchorLookupId != null) {
    const anchor = options.networkAnchorLookupId;
    if (
      chain.subStationNetworkLookupId === anchor ||
      chain.feederNetworkLookupId === anchor ||
      chain.dtrNetworkLookupId === anchor
    ) {
      score += 800;
    }
  }
  if (
    prefs.organisationLookupId != null &&
    chain.organisationLookupId === prefs.organisationLookupId
  ) {
    score += 500;
  }
  if (prefs.dtr && matchesName(chain.dtr, prefs.dtr)) {
    score += 100;
  }
  if (prefs.feeder && matchesName(chain.feeder, prefs.feeder)) {
    score += 50;
  }
  if (prefs.subStation && matchesName(chain.subStation, prefs.subStation)) {
    score += 25;
  }
  if (prefs.zone && matchesName(chain.zone, prefs.zone)) {
    score += 10;
  }
  return score;
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
  return body.success === true ? (body.data?.hierarchy ?? []) : [];
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
  return body.success === true ? (body.data?.hierarchy ?? []) : [];
}

export function getNetworkHierarchyCascade(): NetworkHierarchyCascade | null {
  return cachedCascade;
}

export function hasNetworkHierarchyCascade(): boolean {
  return cachedCascade != null;
}

export function getCascadeZoneName(): string {
  return (
    cachedCascade?.zone ||
    resolveMasterDataEnv("BULK_DTR_ZONE_NAME") ||
    ""
  );
}

export function getCascadeSubStationName(): string {
  return (
    cachedCascade?.subStation ||
    resolveMasterDataEnv("BULK_DTR_SUBSTATION_NAME") ||
    ""
  );
}

export function getCascadeFeederName(): string {
  return (
    cachedCascade?.feeder ||
    resolveMasterDataEnv("BULK_DTR_FEEDER_NAME") ||
    ""
  );
}

export function getCascadeDtrName(): string {
  return (
    cachedCascade?.dtr ||
    resolveMasterDataEnv("BULK_CONSUMER_DTR_NAME") ||
    resolveMasterDataEnv("CREATE_DTR_EXISTS_CODE") ||
    ""
  );
}

/**
 * Resolves the full Zone → Sub Station → Feeder → DTR chain from hierarchy APIs
 * (same cascading behaviour as the UI autoselect dropdowns).
 */
export async function ensureNetworkHierarchyCascadeContext(
  authenticatedApi: APIRequestContext,
  options?: {
    dtrNetworkLookupId?: number;
    organisationLookupId?: number;
    networkAnchorLookupId?: number;
  },
): Promise<NetworkHierarchyCascade | null> {
  const scopedRefresh =
    options?.dtrNetworkLookupId != null ||
    options?.organisationLookupId != null ||
    options?.networkAnchorLookupId != null;

  if (cachedCascade && !scopedRefresh) {
    return cachedCascade;
  }

  if (ensurePromise && !scopedRefresh) {
    await ensurePromise;
    return cachedCascade;
  }

  const run = async (): Promise<NetworkHierarchyCascade | null> => {
    const [networkHierarchy, orgHierarchy] = await Promise.all([
      fetchNetworkHierarchy(authenticatedApi),
      fetchOrganisationHierarchy(authenticatedApi),
    ]);

    if (!networkHierarchy.length || !orgHierarchy.length) {
      console.log("[network-cascade] hierarchy APIs returned empty trees");
      return null;
    }

    const prefs = cascadePreferences(options?.organisationLookupId);
    const candidates: NetworkHierarchyCascade[] = [];

    for (const chain of collectNetworkChains(networkHierarchy)) {
      const org = findOrgZoneForDtrNetworkId(
        orgHierarchy,
        chain.dtrNetworkLookupId,
      );
      if (!org) {
        continue;
      }
      candidates.push({
        zone: org.zone,
        subStation: chain.subStation,
        feeder: chain.feeder,
        dtr: chain.dtr,
        subStationNetworkLookupId: chain.subStationNetworkLookupId,
        feederNetworkLookupId: chain.feederNetworkLookupId,
        dtrNetworkLookupId: chain.dtrNetworkLookupId,
        organisationLookupId: org.organisationLookupId,
      });
    }

    if (!candidates.length) {
      console.log("[network-cascade] no complete Zone→SS→Feeder→DTR chains found");
      return null;
    }

    const orgFiltered =
      prefs.organisationLookupId != null
        ? candidates.filter(
            (chain) =>
              chain.organisationLookupId === prefs.organisationLookupId,
          )
        : candidates;

    const pool = orgFiltered.length > 0 ? orgFiltered : candidates;

    const ranked = pool
      .map((chain) => ({
        chain,
        score: scoreChain(chain, prefs, {
          preferredDtrNetworkLookupId: options?.dtrNetworkLookupId,
          networkAnchorLookupId: options?.networkAnchorLookupId,
        }),
      }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0]?.chain ?? null;
    if (best) {
      cachedCascade = best;
      console.log(
        `[network-cascade] zone="${best.zone}" ss="${best.subStation}" feeder="${best.feeder}" dtr="${best.dtr}" (orgId=${best.organisationLookupId} ssId=${best.subStationNetworkLookupId} feederId=${best.feederNetworkLookupId} dtrId=${best.dtrNetworkLookupId})`,
      );
    }
    return best;
  };

  if (scopedRefresh) {
    return run();
  }

  ensurePromise = run().catch((err) => {
    ensurePromise = null;
    throw err;
  });
  await ensurePromise;
  return cachedCascade;
}

/** @deprecated Use getNetworkHierarchyCascade / ensureNetworkHierarchyCascadeContext */
export type ConsumerBulkHierarchyLabels = Pick<
  NetworkHierarchyCascade,
  "zone" | "subStation" | "feeder" | "dtr"
>;

export function getConsumerBulkHierarchyLabels(): ConsumerBulkHierarchyLabels | null {
  const cascade = getNetworkHierarchyCascade();
  if (!cascade) {
    return null;
  }
  return {
    zone: cascade.zone,
    subStation: cascade.subStation,
    feeder: cascade.feeder,
    dtr: cascade.dtr,
  };
}

export function hasConsumerBulkHierarchyLabels(): boolean {
  return hasNetworkHierarchyCascade();
}

export async function ensureConsumerBulkHierarchyContext(
  authenticatedApi: APIRequestContext,
  options?: {
    dtrNetworkLookupId?: number;
    organisationLookupId?: number;
    networkAnchorLookupId?: number;
  },
): Promise<ConsumerBulkHierarchyLabels | null> {
  const cascade = await ensureNetworkHierarchyCascadeContext(
    authenticatedApi,
    options,
  );
  return cascade
    ? {
        zone: cascade.zone,
        subStation: cascade.subStation,
        feeder: cascade.feeder,
        dtr: cascade.dtr,
      }
    : null;
}

/** Aligns meter + org-scoped hierarchy cascade (same labels as create-consumer / bulk DTR). */
export async function resolveConsumerMeterCascadeContext(
  authenticatedApi: APIRequestContext,
  meter: { meterLookupId?: number; networkLookupId?: number },
  organisationLookupId: number,
): Promise<{
  organisationLookupId: number;
  networkLookupId: number;
  meterLookupId?: number;
  subStation: string;
  feeder: string;
  dtr: string;
  zone: string;
} | null> {
  await ensureConsumerBulkHierarchyContext(authenticatedApi, {
    organisationLookupId,
  });
  const cascade = getNetworkHierarchyCascade();
  if (!cascade) {
    return null;
  }
  return {
    organisationLookupId:
      cascade.organisationLookupId ?? organisationLookupId,
    networkLookupId: cascade.dtrNetworkLookupId,
    meterLookupId: meter.meterLookupId,
    subStation: cascade.subStation,
    feeder: cascade.feeder,
    dtr: cascade.dtr,
    zone: cascade.zone,
  };
}
