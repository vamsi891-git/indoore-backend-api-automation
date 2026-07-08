export type ConsumerActivationStatus = "active" | "inactive";

export type ActivationScenario =
  | "activate"
  | "deactivate"
  | "activate_idempotent"
  | "consumer_not_found"
  | "meter_route_rejected"
  | "invalid_status"
  | "empty_status"
  | "missing_status";

export interface ActivationErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export interface ActivationConsumer {
    cid: string;
    tblRefId: number;
    name: string;
    status: ConsumerActivationStatus | string;
}

export interface ActivationData {
    consumer: ActivationConsumer;
    previousStatus: ConsumerActivationStatus | string;
}

export interface ConsumerActivationResponse {
    success: boolean;
    data: ActivationData;
}

export class ActivationMapper {
    static map(response: ConsumerActivationResponse): ActivationData & {
        success: boolean;
    } {
        const data = response.data ?? ({} as ActivationData);
        return {
            success: response.success,
            consumer: data.consumer ?? {
                cid: "",
                tblRefId: 0,
                name: "",
                status: "",
            },
            previousStatus: data.previousStatus ?? "",
        };
    }
}
