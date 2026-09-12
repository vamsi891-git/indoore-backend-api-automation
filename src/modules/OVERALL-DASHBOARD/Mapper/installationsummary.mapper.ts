export interface InstallationBucket {
  title: string;
  meterCount: number;
  sharePercent: number;
}

export interface InstallationSummaryData {
  totalMeterCount: number;
  installedMeters: InstallationBucket;
  nonInstalledMeters: InstallationBucket;
}

export interface InstallationSummaryResponse {
  success: boolean;
  data?: InstallationSummaryData;
  message?: string;
  error?: { code?: string; message?: string };
}

export class InstallationSummaryMapper {
  static map(
    response: InstallationSummaryResponse,
  ): InstallationSummaryData & { success: boolean } {
    const data = response.data ?? ({} as InstallationSummaryData);
    return {
      success: response.success,
      totalMeterCount: data.totalMeterCount ?? 0,
      installedMeters: data.installedMeters ?? {
        title: "",
        meterCount: 0,
        sharePercent: 0,
      },
      nonInstalledMeters: data.nonInstalledMeters ?? {
        title: "",
        meterCount: 0,
        sharePercent: 0,
      },
    };
  }
}
