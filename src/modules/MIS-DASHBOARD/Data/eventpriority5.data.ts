export const eventPriorityQueries = [
    {
        priority: "Priority5",
        period: "hourly"
    },
    {
        priority: "Priority5",
        period: "daily"
    },
    {
        priority: "Priority5",
        period: "weekly"
    },
    {
        priority: "Priority5",
        period: "monthly"
    }
];
export const backendRules = {
    priorityIds: [1, 2, 3, 4, 5, 6],
    periods: [
        "hourly",
        "daily",
        "weekly",
        "monthly"
    ],
    phaseLabels: [
        "1 PH",
        "3PH 4CT",
        "3PH WC",
        "HT"
    ],
    trendRegex: { 
        hourly: /^\d{2}:\d{2}$/,
        daily: /^\d{4}-\d{2}-\d{2}$/,
        weekly: /^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/,
        monthly: /^\d{4}-\d{2}$/
    }
};