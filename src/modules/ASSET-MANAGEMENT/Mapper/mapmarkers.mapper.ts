export type MapMarkerKind = "consumer" | "dtr";

export type MapMarkerItem = {
  id: string;
  kind: MapMarkerKind;
  assetId: number;
  nodeId: number;
  name: string;
  code: string;
  lat: number;
  lng: number;
};

export type MapMarkersData = {
  markers: MapMarkerItem[];
  count: number;
  limit: number;
  truncated: boolean;
  consumerTotal: number;
  dtrTotal: number;
  consumerMappedTotal: number;
  dtrMappedTotal: number;
  onlineCount: number;
  offlineCount: number;
};

export type MapMarkersResponse = {
  success: boolean;
  data: MapMarkersData;
};

export class MapMarkersMapper {
  static mapData(data: MapMarkersData | null | undefined): MapMarkersData {
    return {
      markers: data?.markers ?? [],
      count: data?.count ?? 0,
      limit: data?.limit ?? 0,
      truncated: data?.truncated ?? false,
      consumerTotal: data?.consumerTotal ?? 0,
      dtrTotal: data?.dtrTotal ?? 0,
      consumerMappedTotal: data?.consumerMappedTotal ?? 0,
      dtrMappedTotal: data?.dtrMappedTotal ?? 0,
      onlineCount: data?.onlineCount ?? 0,
      offlineCount: data?.offlineCount ?? 0,
    };
  }
}
