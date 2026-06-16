export interface Metric {
    title: string;
    value: number | null;
    unit: string;
    /** Optional display label; backend may return null when UI derives subtitles locally */
    subtitle: string | null;
}
export interface PowerQualityResponse {
    success: boolean;
    data?: {
        overallPf: Metric;
        frequency: Metric;
        neutralCurrent: Metric;
        mdKw: Metric;
        mdKva: Metric;
    }
}

const EMPTY_POWER_QUALITY_DATA = {
    overallPf: { title: "Overall PF", value: null, unit: "", subtitle: null },
    frequency: { title: "Frequency", value: null, unit: "", subtitle: null },
    neutralCurrent: { title: "Neutral Current", value: null, unit: "", subtitle: null },
    mdKw: { title: "MD kW", value: null, unit: "", subtitle: null },
    mdKva: { title: "MD kVA", value: null, unit: "", subtitle: null },
} satisfies PowerQualityResponse["data"];

export class PowerQualityMapper {
    static map(response: PowerQualityResponse) {
        const data = response.data ?? EMPTY_POWER_QUALITY_DATA;
        return {
            success:response.success,
            overallPf:data.overallPf,
            frequency:data.frequency,
            neutralCurrent:data.neutralCurrent,
            mdKw:data.mdKw,
            mdKva:data.mdKva
        };
    }
}