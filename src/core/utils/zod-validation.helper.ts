import { expect } from "@playwright/test";
import type { ZodType } from "zod";

export function assertZodSchema<T>(
  schema: ZodType<T>,
  body: unknown,
  label = "Zod Response Schema",
): T {
  const result = schema.safeParse(body);
  expect(
    result.success,
    result.success
      ? `${label} passed`
      : `${label} mismatch:\n${JSON.stringify(result.error.format(), null, 2)}`,
  ).toBe(true);
  return result.data!;
}

export function formatZodError(error: { format: () => unknown }): string {
  return JSON.stringify(error.format(), null, 2);
}
