export interface SearchMeterRow {
  meterId: string;
  nodeId: string | null;
  vendor: string;
  firmwareVersion: string;
  hardwareVersion: string;
  createTime: string;
  updateTime: string;
}

export interface SearchMetersResponse {
  success: boolean;
  data?: SearchMeterRow[];
  error?: { code?: string; message?: string };
}

export interface MappedSearchMetersData {
  meters: SearchMeterRow[];
}

export class CommandsSearchMetersMapper {
  static mapResponse(body: SearchMetersResponse): MappedSearchMetersData {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful search-meters response");
    }

    return {
      meters: body.data.map((row) => ({
        meterId: row.meterId.trim(),
        nodeId: row.nodeId?.trim() ?? null,
        vendor: row.vendor.trim(),
        firmwareVersion: row.firmwareVersion.trim(),
        hardwareVersion: row.hardwareVersion.trim(),
        createTime: row.createTime.trim(),
        updateTime: row.updateTime.trim(),
      })),
    };
  }
}
