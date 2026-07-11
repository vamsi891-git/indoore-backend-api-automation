import { test, expect } from "@playwright/test";
import {
  dedupeMeterSerials,
  formatMeterSerialsQueryParam,
} from "../utils/dedupe-serials.util";

test.describe("dedupe-serials.util", () => {
  test("dedupeMeterSerials removes duplicates and blanks", () => {
    expect(dedupeMeterSerials(["123", "123", "456", "", " 456 "])).toEqual([
      "123",
      "456",
    ]);
  });

  test("formatMeterSerialsQueryParam joins unique serials", () => {
    expect(
      formatMeterSerialsQueryParam(["00256931", "00256931", "85129541"]),
    ).toBe("00256931,85129541");
  });

  test("formatMeterSerialsQueryParam returns undefined when empty", () => {
    expect(formatMeterSerialsQueryParam([])).toBeUndefined();
    expect(formatMeterSerialsQueryParam(["", "  "])).toBeUndefined();
  });
});
