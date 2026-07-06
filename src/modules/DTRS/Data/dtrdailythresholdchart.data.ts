import { istCalendarYear } from "../utils/dtr-backend.util";

export const dtrDailyThresholdChartData = {
    dtrCode: "34SO21",
    year: istCalendarYear(),
    maxResponseTime: 60_000,
    expectedMonths: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ] as const,
    pointsCount: 12,
    pointFields: [
        "month",
        "monthLabel",
        "activePower",
        "reactivePower",
        "apparentPower",
        "powerFactor",
    ] as const,
    powerFields: ["activePower", "reactivePower", "apparentPower", "powerFactor"] as const,
};
