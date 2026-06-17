import dotenv from "dotenv";
import { request } from "@playwright/test";
import { AuthApi } from "../src/core/utils/auth.util.ts";

dotenv.config();

async function main() {
  const login = await AuthApi.login();
  const api = await request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: {
      Accept: "application/json",
      Authorization: `Bearer ${login.accessToken}`,
    },
  });

  const res = await api.get("/indore/master-data/dtr-master-data?page=1&limit=2");
  const body = await res.json();
  console.log("status:", res.status());
  console.log("columns:", JSON.stringify(body.data?.columns, null, 2));
  const first = body.data?.rows?.[0] ?? body.data?.items?.[0];
  console.log("first row keys:", first ? Object.keys(first) : []);
  console.log("first row:", JSON.stringify(first, null, 2));

  await api.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
