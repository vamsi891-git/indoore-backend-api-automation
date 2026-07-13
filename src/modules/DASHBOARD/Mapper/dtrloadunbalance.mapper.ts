export type DtrLoadUnbalanceScenario =
    | "dev_live_primary"
    | "dev_ignore_unknown_query"
    | "contract_all_zero"
    | "contract_mixed_distribution"
    | "contract_all_balanced"
    | "contract_all_severe"
    | "contract_percentage_consistency";

export const DTR_LOAD_UNBALANCE_LABELS = [
    "Severe",
    "Moderate",
    "Balanced",
] as const;

export type DtrLoadUnbalanceLabel = (typeof DTR_LOAD_UNBALANCE_LABELS)[number];

export interface DtrLoadUnbalanceItem {
    label: string;
    value: number;
    percentage: number;
}

/** Raw API item — value/percentage may arrive as strings before normalization. */
export interface DtrLoadUnbalanceItemInput {
    label: string;
    value: number | string;
    percentage: number | string;
}

export interface DtrLoadUnbalanceDataModel {
    items: DtrLoadUnbalanceItemInput[];
}

export interface DtrLoadUnbalanceResponse {
    success: boolean;
    data?: DtrLoadUnbalanceDataModel | null;
    message?: string;
}

export interface DtrLoadUnbalanceErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
    };
}

export interface MappedDtrLoadUnbalance {
    success: boolean;
    message?: string;
    items: DtrLoadUnbalanceItem[];
}

function mapItem(raw: DtrLoadUnbalanceItemInput): DtrLoadUnbalanceItem {
    return {
        label: String(raw?.label ?? ""),
        value: Number(raw?.value ?? 0),
        percentage: Number(raw?.percentage ?? 0),
    };
}

export class DtrLoadUnbalanceMapper {
    static map(response: DtrLoadUnbalanceResponse): MappedDtrLoadUnbalance {
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
