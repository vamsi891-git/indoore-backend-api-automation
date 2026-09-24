import { test, expect } from "@playwright/test";
import { EnvSchema, loadEnv } from "../config/env.schema";

test.describe("env.schema", () => {
  test("accepts minimal valid config", () => {
    const parsed = EnvSchema.safeParse({
      BASE_URL: "https://api.example.com",
      EMAIL: "qa@example.com",
      PASSWORD: "secret",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.BASE_URL).toBe("https://api.example.com");
      expect(parsed.data.DB_HOST).toBeUndefined();
      expect(parsed.data.OBS_DISABLED).toBe(false);
      expect(parsed.data.API_TEST_PRINT_RESPONSE).toBe(false);
    }
  });

  test("lists every missing/invalid field in one ZodError", () => {
    // Field-level failures only — Zod does not run superRefine when the object parse fails.
    const parsed = EnvSchema.safeParse({
      BASE_URL: "not-a-url",
      PASSWORD: "",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const paths = parsed.error.issues.map((i) => i.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["BASE_URL", "PASSWORD"]));
    }
  });

  test("requires EMAIL or USERNAME when core fields are otherwise valid", () => {
    const parsed = EnvSchema.safeParse({
      BASE_URL: "https://api.example.com",
      PASSWORD: "secret",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const paths = parsed.error.issues.map((i) => i.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["EMAIL", "USERNAME"]));
    }
  });

  test("loadEnv throws a single multi-line message", () => {
    expect(() =>
      loadEnv({
        BASE_URL: "",
        PASSWORD: "",
      } as NodeJS.ProcessEnv),
    ).toThrow(/Invalid environment configuration/);
  });

  test("resolvePlaywrightWorkers defaults to 1 and caps at 8", async () => {
    const { resolvePlaywrightWorkers } = await import("../config/env.schema");
    expect(
      resolvePlaywrightWorkers(
        EnvSchema.parse({
          BASE_URL: "https://api.example.com",
          EMAIL: "qa@example.com",
          PASSWORD: "secret",
        }),
      ),
    ).toBe(1);
    expect(
      resolvePlaywrightWorkers(
        EnvSchema.parse({
          BASE_URL: "https://api.example.com",
          EMAIL: "qa@example.com",
          PASSWORD: "secret",
          WORKERS: 3,
        }),
      ),
    ).toBe(3);
    expect(
      resolvePlaywrightWorkers(
        EnvSchema.parse({
          BASE_URL: "https://api.example.com",
          EMAIL: "qa@example.com",
          PASSWORD: "secret",
          PLAYWRIGHT_WORKERS: 99,
        }),
      ),
    ).toBe(8);
  });
});
