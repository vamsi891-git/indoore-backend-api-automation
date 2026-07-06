export const dtrPowerTriangleData = {
    dtrCode: "34SO21",
    maxResponseTime: 90_000,
    requiredFields: [
        "activeEnergyKWh",
        "reactiveEnergyKvarh",
        "apparentEnergyKVAh",
        "powerFactor",
    ] as const,
};
