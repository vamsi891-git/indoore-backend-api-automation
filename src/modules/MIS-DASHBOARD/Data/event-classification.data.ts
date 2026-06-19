export const eventClassificationQuery = {
    reportType: "category-wise"
};
export const backendRules = {
    reportTypes: ["phase-wise","category-wise"],
    expectedCategories: [
        "voltage",
        "current",
        "power",
        "transaction",
        "other",
        "non-rollover-control",
    ],
};
export const labelMappings = {
    voltage: "Voltage",
    current: "Current",
    power: "Power",
    transaction: "Transaction",
    other: "Other",
    "non-rollover-control": "NonRollover",
};