/** Dashboard > Dashboard Overview — derived from live UI screenshots (Jun 2026) */

const MODULE = "Dashboard";
const SUB = "Dashboard Overview";
const PRE = "User logged in as Super Admin on Live (https://indore.bestinfra.app)";

function tc(id, feature, scenario, description, steps, expected, priority, type, severity = "Medium", testData = "Live data as on screenshot date") {
  return {
    id: `IND-DASH-${String(id).padStart(4, "0")}`,
    module: MODULE,
    feature: `${SUB} > ${feature}`,
    requirementId: `REQ-DASH-${String(id).padStart(4, "0")}`,
    scenario,
    description,
    preconditions: PRE,
    testData,
    steps,
    expected,
    priority,
    severity,
    type,
    status: "Not Executed",
  };
}

export const dashboardOverviewCases = [
  // --- Page & layout ---
  tc(1, "Page Load", "Open Dashboard Overview", "Verify page loads with title and breadcrumb", "1. Login\n2. Open Dashboard from sidebar\n3. Select Dashboard Overview", "Page title 'Dashboard Overview' visible; breadcrumb/icon shown; no blank screen", "P0", "Functional", "High"),
  tc(2, "Page Load", "Default data on first load", "All widgets load without manual refresh", "1. Navigate to Dashboard Overview\n2. Wait for loaders to finish", "KPI cards and charts display values; no infinite spinner", "P0", "Functional", "High"),
  tc(3, "Page Load", "Footer copyright", "Verify footer text", "1. Scroll to bottom", "Footer shows '© 2013 - 2026 BestInfra. All Rights Reserved.'", "P2", "UI", "Low"),
  tc(4, "Page Load", "Dark theme consistency", "UI theme across widgets", "1. Review all cards and charts", "Consistent dark navy background; readable white/grey text", "P2", "UI", "Low"),
  tc(5, "Page Load", "Browser refresh", "Data persists after refresh", "1. On Dashboard Overview press F5", "Page reloads; widgets repopulate with data", "P1", "Functional"),
  tc(6, "Navigation", "Sidebar highlight", "Active menu state", "1. Open Dashboard Overview", "Dashboard menu item highlighted in sidebar", "P2", "UI", "Low"),

  // --- Phone verification banner ---
  tc(10, "Phone Verification Banner", "Banner visibility", "Info banner displayed", "1. Open Dashboard Overview", "Banner shows 'Verification of Phone Number' with step indicator (e.g. 1/2)", "P1", "Functional"),
  tc(11, "Phone Verification Banner", "Verify Now button", "CTA is clickable", "1. Click 'Verify Now'", "Verification flow opens or navigates to phone verification screen", "P1", "Functional"),
  tc(12, "Phone Verification Banner", "Banner styling", "Alert styling", "1. Observe banner", "Distinct alert background; info icon visible; text readable", "P2", "UI", "Low"),

  // --- Infrastructure KPI cards ---
  tc(20, "Infrastructure KPI Cards", "Substations card", "Substations count display", "1. Locate Substations card", "Value displayed (e.g. 26); icon visible; mini trend chart shown", "P0", "Functional", "High"),
  tc(21, "Infrastructure KPI Cards", "Substations comparison", "Month-over-month text", "1. Read footer on Substations card", "Shows 'Increase by +X vs last month' with green positive indicator", "P1", "Functional"),
  tc(22, "Infrastructure KPI Cards", "Feeders card", "Feeders count display", "1. Locate Feeders card", "Value displayed (e.g. 1,161); lightning icon; trend chart visible", "P0", "Functional", "High"),
  tc(23, "Infrastructure KPI Cards", "Feeders comparison", "Feeders MoM footer", "1. Read Feeders card footer", "Comparison text matches data direction (increase/decrease)", "P1", "Functional"),
  tc(24, "Infrastructure KPI Cards", "DTRs card", "DTR count display", "1. Locate DTRs card", "Value displayed (e.g. 4,797); cube icon; trend chart visible", "P0", "Functional", "High"),
  tc(25, "Infrastructure KPI Cards", "DTRs comparison", "DTR MoM footer", "1. Read DTR card footer", "Footer shows comparison vs last month", "P1", "Functional"),
  tc(26, "Infrastructure KPI Cards", "Consumers card", "Consumer count display", "1. Locate Consumers card", "Value displayed (e.g. 132,799); footprint icon; trend chart visible", "P0", "Functional", "High"),
  tc(27, "Infrastructure KPI Cards", "Consumers comparison", "Consumers MoM footer", "1. Read Consumers card footer", "Footer shows increase comparison text", "P1", "Functional"),
  tc(28, "Infrastructure KPI Cards", "Number formatting", "Thousands separator", "1. Check all 4 infrastructure cards", "Large numbers use comma separators (e.g. 132,799)", "P1", "UI"),
  tc(29, "Infrastructure KPI Cards", "Cards are clickable", "Cursor/pointer on hover", "1. Hover each of 4 infrastructure KPI cards", "Card shows clickable affordance (pointer cursor or hover state)", "P1", "UI"),

  // --- KPI onClick navigation (drill-down from Dashboard Overview) ---
  tc(200, "KPI Drill-down Navigation", "Click Substations card", "Navigate to Substation Data", "1. Open Dashboard Overview\n2. Click Substations KPI card (count e.g. 26)", "Navigates to Substation Data page; title 'Substation Data'; breadcrumb 'Master data - Substation Data'", "P0", "Functional", "High"),
  tc(201, "KPI Drill-down Navigation", "Substations count match", "Card total vs list total", "1. Note Substations count on dashboard card\n2. Click card\n3. Check pagination total on Substation Data page", "List total matches card count (e.g. 26 = Showing X of 26)", "P0", "Functional", "High"),
  tc(202, "KPI Drill-down Navigation", "Click Feeders card", "Navigate to Feeder Data", "1. Open Dashboard Overview\n2. Click Feeders KPI card (count e.g. 1,161)", "Navigates to Feeder Data page; title 'Feeder Data'; breadcrumb 'Master data - Feeder Data'", "P0", "Functional", "High"),
  tc(203, "KPI Drill-down Navigation", "Feeders count match", "Card total vs list total", "1. Note Feeders count on dashboard\n2. Click Feeders card\n3. Check pagination on Feeder Data page", "Pagination total matches card (e.g. 1,161)", "P0", "Functional", "High"),
  tc(204, "KPI Drill-down Navigation", "Click DTRs card", "Navigate to DTR Data", "1. Open Dashboard Overview\n2. Click DTRs KPI card (count e.g. 4,797)", "Navigates to DTR Data page; title 'DTR Data'", "P0", "Functional", "High"),
  tc(205, "KPI Drill-down Navigation", "DTR count match", "Card total vs list total", "1. Note DTR count on dashboard\n2. Click DTRs card\n3. Check pagination on DTR Data page", "Pagination total matches card (e.g. 4,797 or filtered subset per app logic — document actual)", "P0", "Functional", "High"),
  tc(206, "KPI Drill-down Navigation", "Click Consumers card", "Navigate to Consumer Data", "1. Open Dashboard Overview\n2. Click Consumers KPI card (count e.g. 132,799)", "Navigates to Consumer Data page; title 'Consumer Data'", "P0", "Functional", "High"),
  tc(207, "KPI Drill-down Navigation", "Consumers count match", "Card total vs list total", "1. Note Consumers count on dashboard\n2. Click Consumers card\n3. Check pagination total", "Pagination total matches card (e.g. 132,799)", "P0", "Functional", "High"),
  tc(208, "KPI Drill-down Navigation", "Browser back from drill-down", "Return to dashboard", "1. Click any KPI card to drill down\n2. Press browser Back", "Returns to Dashboard Overview with widgets intact", "P1", "Functional"),
  tc(209, "KPI Drill-down Navigation", "Sidebar back to dashboard", "Re-open overview", "1. From drill-down page click Dashboard in sidebar", "Dashboard Overview reloads correctly", "P1", "Functional"),

  // --- Drill-down destination: Substation Data ---
  tc(210, "Drill-down > Substation Data", "Page load", "Substation list loads", "1. Click Substations card from dashboard", "Table loads with substation rows; search bar visible", "P0", "Functional"),
  tc(211, "Drill-down > Substation Data", "Search", "Search substations", "1. On Substation Data enter text in Search box\n2. Press Enter or wait", "Table filters to matching substation names/IDs", "P0", "Functional"),
  tc(212, "Drill-down > Substation Data", "Hierarchy Type filter", "Filter dropdown", "1. Open Hierarchy Type dropdown\n2. Select a value", "Table data updates per selected hierarchy", "P1", "Functional"),
  tc(213, "Drill-down > Substation Data", "Sub Station filter", "Sub Station dropdown", "1. Open Sub Station dropdown\n2. Select a substation", "Table shows records for selected substation", "P1", "Functional"),
  tc(214, "Drill-down > Substation Data", "Column settings", "Column selector button", "1. Click column settings (three bars icon)", "Column show/hide panel opens", "P2", "Functional"),
  tc(215, "Drill-down > Substation Data", "Table columns", "Data columns present", "1. Review table columns", "Columns include Zone, Substation name, SS ID, and numeric counts; missing hierarchy shows '-'", "P1", "Functional"),
  tc(216, "Drill-down > Substation Data", "Pagination", "Record count", "1. Check pagination footer", "Shows 'Showing 1-20 of 26' (or current total)", "P0", "Functional"),
  tc(217, "Drill-down > Substation Data", "Page 2 navigation", "Second page", "1. Click page 2", "Remaining substation records displayed", "P1", "Functional"),

  // --- Drill-down destination: Feeder Data ---
  tc(220, "Drill-down > Feeder Data", "Page load", "Feeder list loads", "1. Click Feeders card from dashboard", "Feeder Data table loads with columns S.No through Consumer Count", "P0", "Functional"),
  tc(221, "Drill-down > Feeder Data", "Search", "Search feeders", "1. Enter feeder name in Search box", "Table filters to matching feeders", "P0", "Functional"),
  tc(222, "Drill-down > Feeder Data", "Hierarchy Type filter", "Filter by hierarchy", "1. Use Hierarchy Type dropdown", "Table updates correctly", "P1", "Functional"),
  tc(223, "Drill-down > Feeder Data", "Sub Station filter", "Filter by substation", "1. Use Sub Station dropdown", "Feeders for selected substation shown", "P1", "Functional"),
  tc(224, "Drill-down > Feeder Data", "Column headers", "All columns visible", "1. Verify headers", "S.No, Discom, Region, Circle, Division, Zone, Substation, Feeder, DTR Count, Consumer Count", "P1", "Functional"),
  tc(225, "Drill-down > Feeder Data", "Empty hierarchy cells", "Dash for missing data", "1. Check rows with missing Discom/Region", "Empty fields display '-' not undefined", "P1", "Functional"),
  tc(226, "Drill-down > Feeder Data", "Feeder names", "Feeder column values", "1. Read Feeder column", "Values like '33 KV Sarwan', '33 KV AMBICA SOLVNEX' displayed", "P1", "Functional"),
  tc(227, "Drill-down > Feeder Data", "DTR Count column", "Numeric validation", "1. Check DTR Count column", "Integer values (0, 1, 8, etc.)", "P1", "Functional"),
  tc(228, "Drill-down > Feeder Data", "Consumer Count column", "Numeric validation", "1. Check Consumer Count column", "Integer values displayed correctly", "P1", "Functional"),
  tc(229, "Drill-down > Feeder Data", "Pagination info", "Total feeders", "1. Read pagination footer", "Shows 'Showing 1-20 of 1161' (or current)", "P0", "Functional", "High"),
  tc(230, "Drill-down > Feeder Data", "Page size change", "Rows per page", "1. Change '20 / page' to 50", "Table shows 50 rows; pagination updates", "P0", "Functional"),
  tc(231, "Drill-down > Feeder Data", "Next page", "Page navigation", "1. Click page 2 or next arrow", "Next set of feeders loaded", "P0", "Functional"),
  tc(232, "Drill-down > Feeder Data", "Last page", "Navigate to end", "1. Click last page (e.g. 59)", "Last page loads; next disabled", "P1", "Functional"),
  tc(233, "Drill-down > Feeder Data", "Vertical scroll", "Scroll table", "1. Scroll table body", "More rows accessible", "P2", "UI"),

  // --- Drill-down destination: DTR Data ---
  tc(240, "Drill-down > DTR Data", "Page load", "DTR list loads", "1. Click DTRs card from dashboard", "DTR Data table loads with Circle, Division, Zone, Sub Station, Feeder, DTR, Meter columns", "P0", "Functional"),
  tc(241, "Drill-down > DTR Data", "Search", "Search DTRs", "1. Enter DTR ID or meter in Search box", "Table filters to matching records", "P0", "Functional"),
  tc(242, "Drill-down > DTR Data", "Advanced Search toggle ON", "Advanced search enabled", "1. Toggle Advanced Search ON", "Additional search fields/filters appear (if applicable)", "P1", "Functional"),
  tc(243, "Drill-down > DTR Data", "Advanced Search toggle OFF", "Advanced search disabled", "1. Toggle Advanced Search OFF", "Returns to basic search view", "P2", "Functional"),
  tc(244, "Drill-down > DTR Data", "Column filter button", "Column settings", "1. Click filter/column icon", "Column options panel opens", "P2", "Functional"),
  tc(245, "Drill-down > DTR Data", "Meter Sl No column", "Meter serial display", "1. Check Meter Sl No. column", "Serial numbers shown where available; '-' when missing", "P1", "Functional"),
  tc(246, "Drill-down > DTR Data", "MF column", "Multiplying factor", "1. Check MF column", "Numeric MF values (e.g. 60, 80, 120) or '-'", "P1", "Functional"),
  tc(247, "Drill-down > DTR Data", "Latitude/Longitude", "GPS coordinates", "1. Check Lat/Long columns", "High-precision decimals when present; '-' when missing", "P1", "Functional"),
  tc(248, "Drill-down > DTR Data", "Pagination", "Total DTR records", "1. Check pagination", "Shows 'Showing 1-10 of 1566' (or current page size)", "P0", "Functional", "High"),
  tc(249, "Drill-down > DTR Data", "Page size dropdown", "Change page size", "1. Change 10/page to 20/page", "More rows displayed; total pages recalculate", "P1", "Functional"),
  tc(250, "Drill-down > DTR Data", "Horizontal scroll", "Wide table", "1. Scroll horizontally", "Longitude and other columns accessible", "P2", "UI"),

  // --- Drill-down destination: Consumer Data (list view) ---
  tc(260, "Drill-down > Consumer Data", "Page load", "Consumer list loads", "1. Click Consumers card from dashboard", "Consumer Data page opens with search and table/cards", "P0", "Functional"),
  tc(261, "Drill-down > Consumer Data", "Add Consumer button", "Add action visible", "1. Locate top-right actions", "Green 'Add Consumer' button visible", "P1", "Functional"),
  tc(262, "Drill-down > Consumer Data", "Export button", "Export action", "1. Click Export button", "File download starts OR export dialog opens", "P1", "Functional"),
  tc(263, "Drill-down > Consumer Data", "Search Consumers", "Basic search", "1. Enter consumer name/ID in 'Search Consumers'", "List filters to matching consumers", "P0", "Functional"),
  tc(264, "Drill-down > Consumer Data", "Advanced Search toggle", "Toggle advanced filters", "1. Toggle Advanced Search ON/OFF", "UI switches between basic and advanced search modes", "P1", "Functional"),
  tc(265, "Drill-down > Consumer Data", "Card view columns", "Consumer card layout", "1. View consumer rows in card layout", "Avatar initials, Consumer Name, Consumer ID, Address, Mobile, Category, Sanctioned Load, IVRS No. shown", "P0", "Functional"),
  tc(266, "Drill-down > Consumer Data", "Table view columns", "Detailed table layout", "1. Switch to table view if toggle exists OR scroll wide table", "Columns: checkbox, S.No, Division, Zone, Feeder (New/Old), DTR (New/Old), Consumer Name, etc.", "P0", "Functional"),
  tc(267, "Drill-down > Consumer Data", "Row checkbox", "Select consumer", "1. Click row checkbox\n2. Click select-all header checkbox", "Individual and bulk selection works", "P1", "Functional"),
  tc(268, "Drill-down > Consumer Data", "Feeder New/Old mapping", "Feeder column dual values", "1. Read Feeder column in table view", "Shows 'New - [name]' and 'Old - [name]' lines", "P1", "Functional"),
  tc(269, "Drill-down > Consumer Data", "DTR New/Old mapping", "DTR column dual values", "1. Read DTR column", "Shows 'New - [id]' and 'Old - [id]' lines", "P1", "Functional"),
  tc(270, "Drill-down > Consumer Data", "Missing mobile", "Null mobile display", "1. Find row with missing mobile", "Shows '-' or '00' consistently (document actual rule)", "P1", "Functional"),
  tc(271, "Drill-down > Consumer Data", "Meter detail columns", "Meter SI No, Phase, MF", "1. Scroll to meter columns", "Meter SI No., Phase (1 PH/3PH WC/HT), MF, Installation Date displayed", "P1", "Functional"),
  tc(272, "Drill-down > Consumer Data", "Connected to DCU status", "Connection badge", "1. Check Connected to DCU column", "Green 'Connected' pill shown for connected meters", "P1", "Functional"),
  tc(273, "Drill-down > Consumer Data", "View action", "Eye icon drill-down", "1. Click eye/view icon on a row", "Opens consumer detail/profile page", "P0", "Functional", "High"),
  tc(274, "Drill-down > Consumer Data", "Pagination total", "Consumer count", "1. Check pagination footer", "Shows 'Showing 1-10 of 132799' (or current)", "P0", "Functional", "High"),
  tc(275, "Drill-down > Consumer Data", "Last page number", "Pagination math", "1. Verify last page number vs total", "Last page = ceil(total/page size) e.g. 13280 for 10/page", "P1", "Functional"),
  tc(276, "Drill-down > Consumer Data", "Long address wrap", "Text overflow", "1. Find consumer with long address", "Address wraps without breaking layout", "P2", "UI"),
  tc(277, "Drill-down > Consumer Data", "Phase values", "Phase column validation", "1. Check Phase column values", "Only valid phases: 1 PH, 3PH WC, HT", "P1", "Functional"),

  // --- Financial KPI cards (8) ---
  tc(40, "Financial KPI Cards", "Billing Data Availability", "Card value and unit", "1. Locate Billing Data Availability card", "Shows amount in ₹ L (e.g. ₹ 34.24 L); document icon", "P0", "Functional", "High"),
  tc(41, "Financial KPI Cards", "Billing Data Availability trend", "Mini chart and % change", "1. Check trend area and footer", "Blue trend chart; footer shows % increase vs last month in green", "P1", "Functional"),
  tc(42, "Financial KPI Cards", "Billing Data Efficiency", "Card display", "1. Locate Billing Data Efficiency card", "Shows ₹ Cr value (e.g. ₹ 8.75 Cr.); bar chart icon", "P0", "Functional"),
  tc(43, "Financial KPI Cards", "Revenue Gained (RPU)", "Card display", "1. Locate Revenue Gained card", "Amount in ₹ L displayed; link icon visible", "P0", "Functional"),
  tc(44, "Financial KPI Cards", "Overall Improvement", "Card display", "1. Locate Overall Improvement card", "Large ₹ Cr value (e.g. ₹ 146.9 Cr.); star icon", "P0", "Functional"),
  tc(45, "Financial KPI Cards", "Avg Improvement", "Card display", "1. Locate Avg Improvement card", "₹ Cr value shown with trend", "P1", "Functional"),
  tc(46, "Financial KPI Cards", "Subsidy Amount", "Card display", "1. Locate Subsidy Amount card", "₹ Cr value (e.g. ₹ 12.9 Cr.) displayed", "P1", "Functional"),
  tc(47, "Financial KPI Cards", "Incentive PF > 0.85", "Card display", "1. Locate Incentive PF card", "₹ L value with checkmark icon", "P1", "Functional"),
  tc(48, "Financial KPI Cards", "Penalty PF < 0.80", "Negative trend display", "1. Locate Penalty PF card", "₹ K value shown; downward trend; footer shows 'Decrease' in red", "P1", "Functional"),
  tc(49, "Financial KPI Cards", "Currency symbols", "Rupee formatting", "1. Review all 8 financial cards", "All monetary values prefixed with ₹; units L/Cr/K correct", "P1", "UI"),
  tc(50, "Financial KPI Cards", "Positive vs negative color", "Conditional footer colors", "1. Compare increase vs decrease cards", "Increase = green text; decrease (Penalty) = red text", "P1", "UI"),

  // --- Meter Trends ---
  tc(60, "Meter Trends", "Widget title", "Title and subtitle", "1. Locate Meter Trends widget", "Title 'Meter Trends'; subtitle 'Installation Summary'", "P0", "Functional"),
  tc(61, "Meter Trends", "Donut center total", "Total meters in chart center", "1. Read donut center", "Shows 'Total Meters' and total count (e.g. 134,058)", "P0", "Functional", "High"),
  tc(62, "Meter Trends", "Installed meters row", "Installed count and %", "1. Check legend/table", "Installed meters count (e.g. 133,994) and % (e.g. 99.95%) with blue indicator", "P0", "Functional"),
  tc(63, "Meter Trends", "Non-installed meters row", "Non-installed count and %", "1. Check legend/table", "Non-installed count (e.g. 64) and % (e.g. 0.05%) with orange indicator", "P0", "Functional"),
  tc(64, "Meter Trends", "Donut math validation", "Sum equals total", "1. Add installed + non-installed", "Sum equals Total Meters in center; percentages sum to ~100%", "P1", "Functional"),
  tc(65, "Meter Trends", "Download button", "Export chart data", "1. Click download icon on Meter Trends", "File downloads OR export dialog appears; no error toast", "P1", "Functional"),
  tc(66, "Meter Trends", "Chart rendering", "Donut segments visible", "1. Visual check donut", "Dominant blue segment (installed) and small orange segment (non-installed) visible", "P1", "UI"),

  // --- Disconnection Details ---
  tc(70, "Disconnection Details", "Widget title", "Title and date range", "1. Locate Disconnection Details widget", "Title shown; subtitle 'Meter Status · Jan 2026 - Jun 2026'", "P0", "Functional"),
  tc(71, "Disconnection Details", "Legend labels", "Four series legend", "1. Read chart legend", "Legend shows: Disconnected Meters, Reconnected Meters, Communicating Meters, Non-Communicating Meters with color dots", "P0", "Functional"),
  tc(72, "Disconnection Details", "Y-axis scale", "Number of Meters axis", "1. Check Y-axis", "Label 'Number of Meters'; scale 0 to 5k with 1k increments", "P1", "UI"),
  tc(73, "Disconnection Details", "X-axis months", "Six month range", "1. Check X-axis", "Months Jan 2026 through Jun 2026 displayed", "P1", "Functional"),
  tc(74, "Disconnection Details", "Line chart data", "Lines render", "1. Observe chart lines", "Orange (Reconnected) and blue (Disconnected) lines visible with trend; no broken chart", "P0", "Functional"),
  tc(75, "Disconnection Details", "Download button", "Export chart", "1. Click download on Disconnection Details", "Download initiates without error", "P1", "Functional"),
  tc(76, "Disconnection Details", "Tooltip on hover", "Data point tooltip", "1. Hover over line points", "Tooltip shows month and meter count (if supported)", "P2", "Functional"),

  // --- ATR Amount ---
  tc(80, "ATR Amount Chart", "Title and range", "Chart header", "1. Locate ATR Amount (In Lac) chart", "Title and subtitle 'Jan 2026 – Jun 2026' visible", "P0", "Functional"),
  tc(81, "ATR Amount Chart", "Y-axis", "Amount scale", "1. Check Y-axis", "Label 'Amount (Lac)'; grid lines at 0, 100, 200", "P1", "UI"),
  tc(82, "ATR Amount Chart", "Bar data", "Monthly bars", "1. Count bars on X-axis", "Six bars for Jan–Jun 2026; values below 200 Lac range", "P0", "Functional"),
  tc(83, "ATR Amount Chart", "Trend direction", "Upward trend visual", "1. Compare Jan vs Jun bar height", "Jun bar >= Jan bar (slight upward trend per screenshot)", "P2", "Functional"),
  tc(84, "ATR Amount Chart", "Download", "Export ATR chart", "1. Click download icon", "Export works without error", "P1", "Functional"),

  // --- Benefits From Reported ATR Cases ---
  tc(90, "ATR Benefits Widget", "Title", "Widget header", "1. Locate Benefits From Reported ATR Cases", "Title displayed correctly", "P0", "Functional"),
  tc(91, "ATR Benefits Widget", "Donut total", "Total cases center", "1. Read donut center", "Shows 'Total Cases' and count (e.g. 21,840)", "P0", "Functional", "High"),
  tc(92, "ATR Benefits Widget", "MD > SL row", "Penalty category", "1. Check table row", "Label 'MD > SL (penalty)'; value and % shown (may be 0)", "P1", "Functional"),
  tc(93, "ATR Benefits Widget", "Increase SL row", "Major category", "1. Check Increase SL row", "Value (e.g. 20160) and % (e.g. 92.3%) with orange indicator", "P0", "Functional"),
  tc(94, "ATR Benefits Widget", "Aberation cases row", "Aberation category", "1. Check Aberation row", "Value (e.g. 1270) and % (e.g. 5.8%) with green indicator", "P1", "Functional"),
  tc(95, "ATR Benefits Widget", "DL to NDL/IP row", "DL category", "1. Check DL to NDL/IP row", "Value (e.g. 410) and % (e.g. 1.9%) with red indicator", "P1", "Functional"),
  tc(96, "ATR Benefits Widget", "Table sum validation", "Values sum to total", "1. Sum all category values", "Sum equals Total Cases (21,840); percentages sum to 100%", "P1", "Functional", "High"),
  tc(97, "ATR Benefits Widget", "Color mapping", "Donut matches table", "1. Compare donut segments to table colors", "Segment colors match legend dots in table", "P2", "UI"),
  tc(98, "ATR Benefits Widget", "Download", "Export widget", "1. Click download", "Export succeeds", "P1", "Functional"),

  // --- Disconnection Summary (Amount) ---
  tc(100, "Disconnection Summary Chart", "Title and range", "Chart header", "1. Locate Disconnection Summary (Amount In Lac)", "Title and 'Meter Statistics · Jul 2025 – Jun 2026' subtitle", "P0", "Functional"),
  tc(101, "Disconnection Summary Chart", "Y-axis", "Amount Lac scale", "1. Check Y-axis", "0 to 4k Lac with 1k grid lines", "P1", "UI"),
  tc(102, "Disconnection Summary Chart", "Grouped bars", "Four bars per month", "1. Inspect any month group", "Four colored bars (blue, orange, green, coral) per month", "P0", "Functional"),
  tc(103, "Disconnection Summary Chart", "12-month range", "Full year display", "1. Count X-axis labels", "12 months from Jul 2025 to Jun 2026", "P1", "Functional"),
  tc(104, "Disconnection Summary Chart", "Download", "Export chart", "1. Click download", "Export works", "P1", "Functional"),

  // --- Billing Efficiency ---
  tc(110, "Billing Efficiency Chart", "Title and range", "Chart header", "1. Locate Billing Efficiency (In %)", "Title and 'Jul 2025 - Jun 2026' range shown", "P0", "Functional"),
  tc(111, "Billing Efficiency Chart", "Y-axis percentage", "Efficiency scale", "1. Check Y-axis", "0% to 100% in 20% increments; label 'Efficiency (%)'", "P1", "UI"),
  tc(112, "Billing Efficiency Chart", "Grouped bars", "Three bars per month", "1. Inspect monthly group", "Blue (~62%), orange (~85%), green (~23%) bars per month", "P0", "Functional"),
  tc(113, "Billing Efficiency Chart", "Monthly consistency", "All months populated", "1. Scroll X-axis", "All 12 months have bar groups; no missing months", "P1", "Functional"),
  tc(114, "Billing Efficiency Chart", "Download", "Export chart", "1. Click download", "Export succeeds", "P1", "Functional"),

  // --- Feeders table (reached via Feeders KPI click — same as Drill-down > Feeder Data) ---
  tc(120, "Drill-down > Feeder Data", "Table visibility after navigation", "Data table loads from KPI click", "1. Click Feeders KPI from Dashboard Overview", "Feeder Data table visible with feeder names and counts", "P0", "Functional"),
  tc(121, "Drill-down > Feeder Data", "Column data", "Feeder name column", "1. Read Feeder column", "Values like '33 KV Namli', '33 KV NAMLI FEEDER', etc.", "P1", "Functional"),
  tc(122, "Drill-down > Feeder Data", "Empty cells", "Dash for missing data", "1. Check rows with missing hierarchy", "Empty fields show '-' not blank/undefined", "P1", "Functional"),
  tc(123, "Drill-down > Feeder Data", "Zone column", "Zone values", "1. Check Zone column", "Shows values like 'Citi1' where applicable", "P2", "Functional"),
  tc(124, "Drill-down > Feeder Data", "DTR Count column", "Numeric counts", "1. Check DTR count column", "Integer values (0, 1, 3, 4, etc.)", "P1", "Functional"),
  tc(125, "Drill-down > Feeder Data", "Consumer Count column", "Numeric counts", "1. Check consumer count column", "Integer values displayed", "P1", "Functional"),
  tc(126, "Drill-down > Feeder Data", "Pagination info", "Record count text", "1. Read pagination footer", "Shows 'Showing 1-20 of 1161' (or current totals)", "P0", "Functional", "High"),
  tc(127, "Drill-down > Feeder Data", "Page size dropdown", "Rows per page", "1. Open '20 / page' dropdown\n2. Select another size (e.g. 50)", "Table refreshes with new row count; pagination recalculates", "P0", "Functional"),
  tc(128, "Drill-down > Feeder Data", "Next page", "Navigate page 2", "1. Click page 2 or next arrow", "Rows 21-40 (or per page size) displayed; page 2 highlighted", "P0", "Functional"),
  tc(129, "Drill-down > Feeder Data", "Previous page disabled", "First page state", "1. On page 1 check prev arrow", "Previous arrow disabled/greyed", "P1", "UI"),
  tc(130, "Drill-down > Feeder Data", "Last page", "Navigate to last page", "1. Click last page number (e.g. 59)", "Last page loads; data changes; next arrow disabled", "P1", "Functional"),
  tc(131, "Drill-down > Feeder Data", "Horizontal scroll", "Wide table scroll", "1. Scroll horizontally if scrollbar present", "Hidden columns accessible; headers align with data", "P2", "UI"),
  tc(132, "Drill-down > Feeder Data", "Vertical scroll", "Table body scroll", "1. Scroll within table", "Additional rows accessible without breaking header", "P2", "UI"),

  // --- Substations table (reached via Substations KPI click) ---
  tc(140, "Drill-down > Substation Data", "Pagination after navigation", "Substation pagination", "1. Click Substations KPI\n2. Check footer", "Shows 'Showing 1-20 of 26' (or current); pages 1-2 available", "P1", "Functional"),
  tc(141, "Drill-down > Substation Data", "Page navigation", "Navigate pages", "1. Go to page 2", "Remaining substation records displayed", "P1", "Functional"),

  // --- Negative & error ---
  tc(150, "Error Handling", "Slow API load", "Loader during fetch", "1. Throttle network (DevTools) or observe slow load", "Loading indicator shown; page does not freeze permanently", "P1", "Functional"),
  tc(151, "Error Handling", "API failure", "Error state", "1. Simulate API 500 (if possible) or observe during outage", "User-friendly error message; widgets do not show 'undefined'", "P1", "Negative", "High"),
  tc(152, "Error Handling", "Partial widget failure", "One widget fails", "1. If one API fails", "Other widgets still render; failed widget shows error/empty state", "P2", "Negative"),

  // --- Performance ---
  tc(160, "Performance", "Initial load time", "Page load SLA", "1. Clear cache\n2. Navigate to Dashboard Overview\n3. Note time until all widgets loaded", "Page usable within acceptable time (document actual; e.g. < 60s)", "P1", "Non-Functional"),
  tc(161, "Performance", "Chart render time", "Charts after data", "1. Measure time until all charts painted", "All charts render without layout shift breaking page", "P2", "Non-Functional"),

  // --- Accessibility / UI ---
  tc(170, "UI", "Readability", "Text contrast", "1. Review all labels on dark background", "All text readable; no clipped titles", "P2", "UI"),
  tc(171, "UI", "Icon visibility", "Card icons", "1. Check each KPI card icon", "Icons visible and match card color theme", "P2", "UI"),
  tc(172, "UI", "Chart legends", "Legend readability", "1. Review all chart legends", "Legend text not truncated; colors distinguishable", "P2", "UI"),

  // --- Data cross-check (manual spot) ---
  tc(180, "Data Validation", "KPI vs drill-down totals", "Card count matches list", "1. For each KPI (Substations, Feeders, DTRs, Consumers) click card and compare pagination total", "Drill-down list total matches dashboard KPI count", "P0", "Functional", "High"),
  tc(181, "Data Validation", "Meter total spot-check", "Meter trends vs consumers", "1. Compare Total Meters (Meter Trends) to consumer+meter logic", "Values plausible; document if discrepancy", "P2", "Functional"),
];
