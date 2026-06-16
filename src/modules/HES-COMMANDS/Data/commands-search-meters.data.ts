export const commandsSearchMetersData = {
  defaultItemCount: 10,
  defaultItemStart: 1,
  paginationItemCount: 5,
  paginationItemStart: 6,
  invalidItemCount: 0,
  maxResponseTimeMs: 120_000,
  /** Stable HES meter ordering for itemStart=1, itemCount=10 smoke window. */
  expectedFirstPageMeterIds: [
    "ABCDEF2400166",
    "AW8005338",
    "AW8005337",
    "ABCDEF2400165",
    "40000001",
    "95610000975",
    "40000002",
    "60000001",
    "@123456",
    "@281120",
  ],
  expectedPaginationMeterIds: [
    "95610000975",
    "40000002",
    "60000001",
    "@123456",
    "@281120",
  ],
  searchMeterId: "AW8005338",
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
