export type DtrVoltageUnbalanceScenario =
    | "dev_live_primary"
    | "dev_ignore_unknown_query"
    | "contract_all_zero"
    | "contract_mixed_distribution"
    | "contract_all_balanced"
    | "contract_all_severe"
    | "contract_percentage_consistency";

export const DTR_VOLTAGE_UNBALANCE_LABELS = [
    "Severe",
    "Moderate",
    "Balanced",
] as const;

export type DtrVoltageUnbalanceLabel =
    (typeof DTR_VOLTAGE_UNBALANCE_LABELS)[number];

export interface DtrVoltageUnbalanceItem {
    label: string;
    value: number;
    percentage: number;
}

/** Raw API item — value/percentage may arrive as strings before normalization. */
export interface DtrVoltageUnbalanceItemInput {
    label: string;
    value: number | string;
    percentage: number | string;
}

export interface DtrVoltageUnbalanceDataModel {
    items: DtrVoltageUnbalanceItemInput[];
}

export interface DtrVoltageUnbalanceResponse {
    success: boolean;
    data?: DtrVoltageUnbalanceDataModel | null;
    message?: string;
}

export interface DtrVoltageUnbalanceErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrVoltageUnbalance {
    success: boolean;
    message?: string;
    items: DtrVoltageUnbalanceItem[];
}

function mapItem(raw: DtrVoltageUnbalanceItemInput): DtrVoltageUnbalanceItem {
    return {
        label: String(raw?.label ?? ""),
        value: Number(raw?.value ?? 0),
        percentage: Number(raw?.percentage ?? 0),
    };
}

export class DtrVoltageUnbalanceMapper {
    static map(
        response: DtrVoltageUnbalanceResponse,
    ): MappedDtrVoltageUnbalance {
        const items = Array.isArray(response.data?.items)
            ? response.data!.items.map(mapItem)
            : [];

        return {
            success: Boolean(response.success),
            message: response.message,
            items,
        };
    }
}
