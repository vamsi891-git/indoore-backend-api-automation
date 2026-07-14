export type MeterReplacementSubmissionStatus = "PENDING" | "COMPLETED" | string;

export interface CreateSubmissionData {
  id: number;
  status: MeterReplacementSubmissionStatus;
}

export interface CreateSubmissionResponse {
  success: boolean;
  data: CreateSubmissionData;
}

export class CreateSubmissionMapper {
  static map(
    response: CreateSubmissionResponse,
  ): CreateSubmissionData & { success: boolean } {
    const data = response.data ?? ({} as CreateSubmissionData);
    return {
      success: response.success,
      id: Number(data.id) || 0,
      status: String(data.status ?? "").trim(),
    };
  }
}
