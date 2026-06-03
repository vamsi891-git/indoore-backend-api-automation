export const eventNonRolloverQueries=[
    {reportType:"phase-wise",period:"hourly"},
    {reportType:"phase-wise",period:"daily"},
    {reportType:"phase-wise",period:"weekly"},
    {reportType:"phase-wise",period:"monthly"},
    {reportType:"category-wise",period:"hourly"},
    {reportType:"category-wise",period:"daily"},
    {reportType:"category-wise",period:"weekly"},
    {reportType:"category-wise",period:"monthly"}
    ];
    export const backendRules={
    reportTypes:[
    "phase-wise",
    "category-wise"
    ],
    periods:[
    "hourly",
    "daily",
    "weekly",
    "monthly"
    ], 
    phaseLabels:[
    "1 PH",
    "3PH 4CT",
    "3PH WC",
    "HT"
    ],
    categoryLabels:[
    "AGRI",
    "COM",
    "IND",
    "RES",
    "SCH",
    "SLIGHT",
    "TEMP",
    "UNKNOWN"
    ],
    trendRegex:{
    hourly:/^\d{2}:\d{2}$/,
    daily:/^\d{4}-\d{2}-\d{2}$/,
    weekly:/^\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/,
    monthly:/^\d{4}-\d{2}$/
    },

    expectedTrendCount:{
    hourly:24,
    weekly:4
    }
    };