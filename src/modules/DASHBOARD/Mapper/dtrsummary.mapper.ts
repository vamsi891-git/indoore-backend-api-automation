export interface SummaryMetric {
    label: string;
    count: number;
    trends: number[];
}

export interface DtrSummaryResponse {
    success: boolean;
    data: {
        period: string;
        totalDtrs: SummaryMetric;
        dtrsOn: SummaryMetric;
        dtrsOff: SummaryMetric;
        activeAlerts: SummaryMetric;
    };
    message: string;
}

export interface DtrSummaryModel {
    period: string;
    totalDtrs: SummaryMetric;
    dtrsOn: SummaryMetric;
    dtrsOff: SummaryMetric;
    activeAlerts: SummaryMetric;
}

export class DtrSummaryMapper {

    static mapData(
        response: DtrSummaryResponse
    ): DtrSummaryModel {

        return {

            period: response.data.period,

            totalDtrs: {
                label: response.data.totalDtrs.label,
                count: Number(response.data.totalDtrs.count ?? 0),
                trends: response.data.totalDtrs.trends ?? []
            },

            dtrsOn: {
                label: response.data.dtrsOn.label,
                count: Number(response.data.dtrsOn.count ?? 0),
                trends: response.data.dtrsOn.trends ?? []
            },

            dtrsOff: {
                label: response.data.dtrsOff.label,
                count: Number(response.data.dtrsOff.count ?? 0),
                trends: response.data.dtrsOff.trends ?? []
            },

            activeAlerts: {
                label: response.data.activeAlerts.label,
                count: Number(response.data.activeAlerts.count ?? 0),
                trends: response.data.activeAlerts.trends ?? []
            }
        };
    }
}