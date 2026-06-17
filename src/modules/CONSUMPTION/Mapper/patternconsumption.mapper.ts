export interface PatternConsumptionTable {
    title: string;
    columns: any[];
    rows: any[];
}

export interface PatternConsumptionResponse {
    success: boolean;
    data?: {
        table?: PatternConsumptionTable;
    };
}

const EMPTY_TABLE: PatternConsumptionTable = {
    title: "",
    columns: [],
    rows: [],
};

export class PatternConsumptionMapper {

    static map(response: PatternConsumptionResponse) {
        const table = response.data?.table ?? EMPTY_TABLE;
        return {
            success: response.success,
            title: table.title ?? "",
            columns: table.columns ?? [],
            rows: table.rows ?? [],
        };
    }
}
