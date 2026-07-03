export const dtrCapacityGaugeData = {
    dtrCode: "34SO21",
    expectedBands: [
        "Instant",
        "Daily",
        "Monthly",
        "Yearly",
        "LifeTime",
    ] as const,
    bandUnits: {
        Instant: "KVA",
        Daily: "MDkVA",
        Monthly: "MDkVA",
        Yearly: "MDkVA",
        LifeTime: "MDkVA",
    } as const,
    mdBands: ["Daily", "Monthly", "Yearly", "LifeTime"] as const,
};
