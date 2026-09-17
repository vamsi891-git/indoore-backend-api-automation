import {
  backendRules,
  eventPriorityCasesFor,
} from "./eventpriority.data";

export { backendRules };

export const eventPriorityPath = "Priority3";

export const eventPriorityQuery = {
  period: "daily",
  assetType: "all",
};

export const eventPriorityQueries = [
  { priority: eventPriorityPath, period: "hourly" },
  { priority: eventPriorityPath, period: "daily" },
  { priority: eventPriorityPath, period: "weekly" },
  { priority: eventPriorityPath, period: "monthly" },
];

export const eventPriorityTestCases = eventPriorityCasesFor(3);
