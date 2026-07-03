export const dtrEventsData = {
    dtrCode: "34SO21",
    page: 1,
    limit: 20,
    maxResponseTime: 60_000,
    allowedStatuses: ["Resolved", "Pending"] as const,
    dataFields: ["rows", "page", "pageSize", "totalCount", "totalPages"] as const,
    rowFields: [
        "serialNo",
        "meterSlNo",
        "eventDateTime",
        "restoredDateTime",
        "description",
        "duration",
        "status",
    ] as const,
};
