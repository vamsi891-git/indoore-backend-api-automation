export interface Metric {
    title: string;
    value: number | null;
    unit: string;
    /** Optional display label; backend may return null when UI derives subtitles locally */
    subtitle: string | null;
}
export interface PowerQualityResponse {
    success: boolean;
    data: {
        overallPf: Metric;
        frequency: Metric;
        neutralCurrent: Metric;
        mdKw: Metric;
        mdKva: Metric;
    }
}
export class PowerQualityMapper {
    static map(response: PowerQualityResponse) {
        return {
            success:response.success,
            overallPf:response.data.overallPf,
            frequency:response.data.frequency,
            neutralCurrent:response.data.neutralCurrent,
            mdKw:response.data.mdKw,
            mdKva:response.data.mdKva
        };
    }
}