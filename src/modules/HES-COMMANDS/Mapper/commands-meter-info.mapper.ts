export interface CommandsMeterInfoRow {
  meterId: string;
  nodeId: string;
  vendor: string;
  firmwareVersion: string;
  hardwareVersion: string;
  createTime: string;
  updateTime: string;
}

export interface CommandsMeterInfoResponse {
  success: boolean;
  data?: CommandsMeterInfoRow;
  error?: { code: string; message: string };
}

export class CommandsMeterInfoMapper {
  static mapResponse(body: CommandsMeterInfoResponse): CommandsMeterInfoRow {
    if (!body.success || !body.data) {
      throw new Error("Cannot map unsuccessful meter-info response");
    }

    const data = body.data;
    return {
      meterId: data.meterId.trim(),
      nodeId: data.nodeId.trim(),
      vendor: data.vendor.trim(),
      firmwareVersion: data.firmwareVersion.trim(),
      hardwareVersion: data.hardwareVersion.trim(),
      createTime: data.createTime.trim(),
      updateTime: data.updateTime.trim(),
    };
  }
}
