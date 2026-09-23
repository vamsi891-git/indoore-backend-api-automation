export const commandsSearchMetersData = {
  defaultItemCount: 10,
  defaultItemStart: 1,
  paginationItemCount: 5,
  paginationItemStart: 6,
  invalidItemCount: 0,
  maxResponseTimeMs: 120_000,
  /** Live HES meter ordering for itemStart=1, itemCount=10 (update when pool changes). */
  expectedFirstPageMeterIds: [
    "9697800",
    "EZ9100144",
    "CA0225944",
    "SC12220562",
    "6164177",
    "40000002",
    "19272930",
    "00250709",
    "99751580",
    "85092812",
  ],
  expectedPaginationMeterIds: ["40000002", "19272930", "00250709", "99751580", "85092812"],
  searchMeterId: "99751580",
} as const;

export const SEARCH_METERS_PATH = "/indore/commands/search-meters";

export interface SearchMetersRequestBody {
  itemCount: number;
  itemStart: number;
}

export function buildSearchMetersBody(
  overrides: Partial<SearchMetersRequestBody> = {},
): SearchMetersRequestBody {
  return {
    itemCount: commandsSearchMetersData.defaultItemCount,
    itemStart: commandsSearchMetersData.defaultItemStart,
    ...overrides,
  };
}
