/**
 * Probe daily consumption API with candidate date ranges.
 * Run: node scripts/probe-daily-consumption.mjs
 */
import dotenv from "dotenv";
import { request } from "@playwright/test";
import { AuthApi } from "../src/core/utils/auth.util.ts";

dotenv.config();

const candidates = [
  { label: "dec-20-single", fromDate: "2025-12-20", toDate: "2025-12-20", month: 12, year: 2025, limit: 10 },
  { label: "dec-19-single", fromDate: "2025-12-19", toDate: "2025-12-19", month: 12, year: 2025, limit: 10 },
  { label: "dec-20-limit-5", fromDate: "2025-12-20", toDate: "2025-12-20", month: 12, year: 2025, limit: 5 },
  { label: "nov-15-single", fromDate: "2025-11-15", toDate: "2025-11-15", month: 11, year: 2025, limit: 10 },
  { label: "dec-range-2d", fromDate: "2025-12-19", toDate: "2025-12-20", month: 12, year: 2025, limit: 10 },
];

async function main() {
  const login = await AuthApi.login();
  const api = await request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: {
      Accept: "application/json",
      Authorization: `Bearer ${login.accessToken}`,
    },
  });

  for (const c of candidates) {
    const started = Date.now();
    const res = await api.get("/indore/consumption/report", {
      params: {
        reportType: "daily",
        page: 1,
        limit: c.limit,
        fromDate: c.fromDate,
        toDate: c.toDate,
        month: c.month,
        year: c.year,
      },
      timeout: 360_000,
    });
    const ms = Date.now() - started;
    let body = "";
    try {
      body = JSON.stringify(await res.json()).slice(0, 120);
    } catch {
      body = "<no json>";
    }
    console.log(`${c.label}: ${res.status()} in ${ms}ms — ${body}`);
  }

  await api.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
