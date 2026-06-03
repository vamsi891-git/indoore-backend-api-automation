export interface PatternConsumptionResponse {
    success: boolean;
    data: {
        table: {
            title: string;
            columns: any[];
            rows: any[];
        };
    };
}

export class PatternConsumptionMapper {

    static map(response: PatternConsumptionResponse) {

        return {
            title: response.data.table.title,
            columns: response.data.table.columns,
            rows: response.data.table.rows
        };
    }
}