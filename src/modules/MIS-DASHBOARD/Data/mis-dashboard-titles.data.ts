export function misPeriodWords(period: string): string {
  const labels: Record<string, string> = {
    hourly: "hour by hour",
    daily: "day by day",
    weekly: "week by week",
    monthly: "month by month",
  };
  return labels[period] ?? period;
}

export function misGroupingWords(reportType: string): string {
  if (reportType === "phase-wise") {
    return "by meter type";
  }
  if (reportType === "category-wise") {
    return "by consumer category";
  }
  if (reportType === "priority-wise") {
    return "by urgency";
  }
  return reportType;
}

export function misEventChartTitle(
  screen: string,
  reportType: string,
  period: string,
): string {
  return `${screen} — ${misGroupingWords(reportType)}, ${misPeriodWords(period)}`;
}

export function misUrgencyTitle(
  level: number,
  period: string,
  extra?: string,
): string {
  const base = `Urgency level ${level} events — ${misPeriodWords(period)}`;
  return extra ? `${base} (${extra})` : base;
}
