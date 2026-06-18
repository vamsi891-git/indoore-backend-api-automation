import dotenv from "dotenv";
import { request } from "@playwright/test";
import { AuthApi } from "../src/core/utils/auth.util.ts";

dotenv.config();

async function main() {
  const login = await AuthApi.login();
  const api = await request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${login.accessToken}`,
    },
  });

  const r = await api.get("/indore/analysis/technical/report", {
    params: {
      analysisType: "power_failure",
      month: 12,
      year: 2025,
      category: "total",
      pageSize: 2,
    },
    timeout: 120_000,
  });

  const body = await r.json();
  console.log("status:", r.status());
  console.log("data keys:", body.data ? Object.keys(body.data) : null);
  if (body.data?.pagination) console.log("pagination:", body.data.pagination);
  if (body.data?.rows?.[0]) console.log("first row keys:", Object.keys(body.data.rows[0]));
  console.log(JSON.stringify(body, null, 2).slice(0, 3000));

  await api.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
