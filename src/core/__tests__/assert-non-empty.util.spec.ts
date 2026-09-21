import { test, expect } from "@playwright/test";
import { assertNonEmpty } from "../utils/assert-non-empty.util";

test.describe("assertNonEmpty", () => {
  test("passes when rows exist", () => {
    expect(() => assertNonEmpty([{ id: 1 }], "dashboard rows")).not.toThrow();
  });

  test("fails on empty or missing", () => {
    expect(() => assertNonEmpty([], "primary table")).toThrow(/non-empty primary table/);
    expect(() => assertNonEmpty(undefined, "list")).toThrow(/non-empty list/);
  });
});
