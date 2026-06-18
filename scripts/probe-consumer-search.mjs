import dotenv from "dotenv";
import { request } from "@playwright/test";
import { AuthApi } from "../src/core/utils/auth.util.ts";

dotenv.config();

async function main() {
  const login = await AuthApi.login();
  const api = await request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${login.accessToken}` },
  });

  const r = await api.get("/indore/utils/search/consumers?page=1&limit=2");
  const body = await r.json();
  console.log("status:", r.status());
  console.log("data keys:", body.data ? Object.keys(body.data) : null);
  if (body.data?.columns) {
    console.log("columns:", body.data.columns.map((c) => c.key).join(", "));
  }
  const first = body.data?.rows?.[0] ?? body.data?.items?.[0];
  console.log("first row keys:", first ? Object.keys(first) : null);
  console.log("first row:", JSON.stringify(first, null, 2));
  console.log("pagination:", body.data?.pagination);

  await api.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
