export interface ProgressChart {
  labels: string[];
  values: number[];
}

export interface ProgressData {
  weekly: ProgressChart;
  monthly: ProgressChart;
}

export interface ProgressResponse {
  success: boolean;
  data: ProgressData;
}

export class ProgressMapper {
  static map(
    response: ProgressResponse,
  ): ProgressData & { success: boolean } {
    const data = response.data ?? ({} as ProgressData);

    return {
      success: response.success,
      weekly: {
        labels: (data.weekly?.labels ?? []).map((label) =>
          String(label ?? "").trim(),
        ),
        values: (data.weekly?.values ?? []).map((value) =>
          Number(value) || 0,
        ),
      },
      monthly: {
        labels: (data.monthly?.labels ?? []).map((label) =>
          String(label ?? "").trim(),
        ),
        values: (data.monthly?.values ?? []).map((value) =>
          Number(value) || 0,
        ),
      },
    };
  }
}
