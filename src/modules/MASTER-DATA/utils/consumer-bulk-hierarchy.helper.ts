import type { APIRequestContext } from "@playwright/test";
import { DtrMasterApi } from "../Api/dtr-master.api";
import { DtrMasterMapper } from "../Mapper/dtr-master.mapper";
import {
  getCreateConsumerMeterContext,
  setCreateConsumerMeterContext,
} from "../Data/create-consumer.data";
import {
  getCascadeDtrName,
  getCascadeFeederName,
  getCascadeSubStationName,
  getCascadeZoneName,
  getNetworkHierarchyCascade,
} from "./network-hierarchy-cascade.helper";

export interface ConsumerBulkHierarchyLabels {
  zone: string;
  subStation: string;
  feeder: string;
  dtr: string;
}

let masterHierarchyCache: ConsumerBulkHierarchyLabels | null = null;
let ensurePromise: Promise<ConsumerBulkHierarchyLabels | null> | null = null;

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickDtrMasterRow(
  rows: ReturnType<typeof DtrMasterMapper.mapData>["items"],
  targets: {
    dtr?: string;
    feeder?: string;
    subStation?: string;
    zone?: string;
  },
): (typeof rows)[number] | undefined {
  const dtrKey = targets.dtr ? normalizeKey(targets.dtr) : "";
  const feederKey = targets.feeder ? normalizeKey(targets.feeder) : "";
  const subStationKey = targets.subStation ? normalizeKey(targets.subStation) : "";
  const zoneKey = targets.zone ? normalizeKey(targets.zone) : "";

  const scored = rows
    .map((row) => {
      let score = 0;
      if (dtrKey && row.dtr && normalizeKey(row.dtr) === dtrKey) {
        score += 100;
      }
      if (feederKey && row.feeder && normalizeKey(row.feeder) === feederKey) {
        score += 50;
      }
      if (
        subStationKey &&
        row.subStation &&
        normalizeKey(row.subStation) === subStationKey
      ) {
        score += 25;
      }
      if (zoneKey && row.zone && normalizeKey(row.zone) === zoneKey) {
        score += 10;
      }
      return { row, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.row ?? rows.find((row) => row.zone && row.subStation && row.feeder && row.dtr);
}

/**
 * Bulk consumer upload resolves hierarchy via master-data lookups (same normalized
 * names as POST /indore/consumers). Prefer DTR master row labels over cascade env.
 */
export async function ensureConsumerBulkHierarchyFromMasterData(
  authenticatedApi: APIRequestContext,
): Promise<ConsumerBulkHierarchyLabels | null> {
  if (masterHierarchyCache) {
    return masterHierarchyCache;
  }

  if (ensurePromise) {
    await ensurePromise;
    return masterHierarchyCache;
  }

  ensurePromise = (async () => {
    const cascade = getNetworkHierarchyCascade();
    const meterContext = getCreateConsumerMeterContext();
    const targets = {
      dtr: meterContext?.dtr ?? cascade?.dtr ?? getCascadeDtrName(),
      feeder: meterContext?.feeder ?? cascade?.feeder ?? getCascadeFeederName(),
      subStation:
        meterContext?.subStation ??
        cascade?.subStation ??
        getCascadeSubStationName(),
      zone: meterContext?.zone ?? cascade?.zone ?? getCascadeZoneName(),
    };

    if (!targets.dtr) {
      return null;
    }

    const dtrMasterApi = new DtrMasterApi(authenticatedApi);
    const { responseBody, rawResponse } = await dtrMasterApi.getDtrMasterData({
      q: targets.dtr,
      limit: 50,
    });

    if (rawResponse.status() !== 200 || !responseBody.success) {
      console.log(
        `[consumer-bulk-hierarchy] dtr-master lookup failed for dtr="${targets.dtr}"`,
      );
      return null;
    }

    const mapped = DtrMasterMapper.mapData(responseBody.data, 50);
    const match = pickDtrMasterRow(mapped.items, targets);
    if (
      !match?.zone?.trim() ||
      !match.subStation?.trim() ||
      !match.feeder?.trim() ||
      !match.dtr?.trim()
    ) {
      console.log(
        `[consumer-bulk-hierarchy] no complete hierarchy row for dtr="${targets.dtr}"`,
      );
      return null;
    }

    masterHierarchyCache = {
      zone: match.zone.trim(),
      subStation: match.subStation.trim(),
      feeder: match.feeder.trim(),
      dtr: match.dtr.trim(),
    };

    if (meterContext) {
      setCreateConsumerMeterContext({
        ...meterContext,
        ...masterHierarchyCache,
      });
    }

    console.log(
      `[consumer-bulk-hierarchy] zone="${masterHierarchyCache.zone}" ss="${masterHierarchyCache.subStation}" feeder="${masterHierarchyCache.feeder}" dtr="${masterHierarchyCache.dtr}"`,
    );
    return masterHierarchyCache;
  })().catch((err) => {
    ensurePromise = null;
    throw err;
  });

  await ensurePromise;
  return masterHierarchyCache;
}

export function getConsumerBulkMasterHierarchyLabels(): ConsumerBulkHierarchyLabels | null {
  return masterHierarchyCache;
}
