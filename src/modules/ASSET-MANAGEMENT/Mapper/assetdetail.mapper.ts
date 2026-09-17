export type AssetHierarchyPathEntry = {
  id: number;
  type: string;
  code: string;
  name: string;
};

export type AssetHierarchySummaryRow = {
  type: string;
  label: string;
  relationship: string;
  directCount: number | null;
  descendantCount: number | null;
};

export type AssetMeterSummary = {
  total: number;
  active: number | null;
  inactive: number | null;
  faulty: number | null;
  unknown: number | null;
  available: boolean;
};

export type AssetCommunicationSummary = {
  available: boolean;
  consumerOnline: number;
  dtrOnline: number;
  totalOnline: number;
  consumerOffline: number;
  dtrOffline: number;
  totalOffline: number;
};

export type AssetRecentActivityItem = {
  id: string;
  type: string;
  title: string;
  occurredAt: string;
  entityId: string | null;
};

export type AssetRecentActivity = {
  available: boolean;
  items: AssetRecentActivityItem[];
  total: number;
};

export type AssetDetailData = {
  id: number;
  kind: string;
  type: string;
  code: string;
  name: string;
  displayName: string;
  status: string;
  hierarchyPath: AssetHierarchyPathEntry[];
  hierarchySummary: AssetHierarchySummaryRow[];
  consumerCount: number | null;
  dtrCount: number | null;
  meterCount: number | null;
  activeMeterCount: number | null;
  inactiveMeterCount: number | null;
  faultyMeterCount: number | null;
  unknownMeterCount: number | null;
  assetHealthPercentage: number | null;
  assetHealthAvailable: boolean;
  connectedSince: string | null;
  lastUpdatedAt: string | null;
  meterSummary: AssetMeterSummary | null;
  communicationSummary: AssetCommunicationSummary | null;
  recentActivity: AssetRecentActivity;
};

export type AssetDetailResponse = {
  success: boolean;
  data: AssetDetailData;
};

export class AssetDetailMapper {
  static mapData(data: AssetDetailData | null | undefined): AssetDetailData {
    return {
      id: data?.id ?? 0,
      kind: data?.kind ?? "",
      type: data?.type ?? "",
      code: data?.code ?? "",
      name: data?.name ?? "",
      displayName: data?.displayName ?? "",
      status: data?.status ?? "",
      hierarchyPath: data?.hierarchyPath ?? [],
      hierarchySummary: data?.hierarchySummary ?? [],
      consumerCount: data?.consumerCount ?? null,
      dtrCount: data?.dtrCount ?? null,
      meterCount: data?.meterCount ?? null,
      activeMeterCount: data?.activeMeterCount ?? null,
      inactiveMeterCount: data?.inactiveMeterCount ?? null,
      faultyMeterCount: data?.faultyMeterCount ?? null,
      unknownMeterCount: data?.unknownMeterCount ?? null,
      assetHealthPercentage: data?.assetHealthPercentage ?? null,
      assetHealthAvailable: data?.assetHealthAvailable ?? false,
      connectedSince: data?.connectedSince ?? null,
      lastUpdatedAt: data?.lastUpdatedAt ?? null,
      meterSummary: data?.meterSummary ?? null,
      communicationSummary: data?.communicationSummary ?? null,
      recentActivity: data?.recentActivity ?? {
        available: false,
        items: [],
        total: 0,
      },
    };
  }
}
