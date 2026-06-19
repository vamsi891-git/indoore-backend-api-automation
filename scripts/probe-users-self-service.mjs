import dotenv from "dotenv";
import { request } from "@playwright/test";
import { AuthApi } from "../src/core/utils/auth.util.ts";

dotenv.config();

const CANDIDATE_PATHS = [
  "/indore/users/self-service",
  "/indore/users-self-service",
  "/indore/user-self-service",
  "/indore/self-service",
  "/indore/users/self-service/otp/send",
  "/indore/users/self-service/otp/verify",
  "/indore/users/self-service/send-otp",
  "/indore/users/self-service/verify-otp",
  "/indore/auth/otp/send",
  "/indore/auth/otp/verify",
  "/indore/auth/verify-otp",
  "/indore/auth/send-otp",
];

async function probePath(api, method, path, data) {
  const opts = { timeout: 30_000 };
  const res =
    method === "GET"
      ? await api.get(path, opts)
      : await api.post(path, { ...opts, data });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 500);
  }
  return { status: res.status(), body };
}

async function main() {
  const login = await AuthApi.login();
  const authed = await request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${login.accessToken}`,
      Accept: "application/json",
    },
  });
  const publicApi = await request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: { Accept: "application/json" },
  });

  const email = process.env.EMAIL ?? process.env.USERNAME ?? "test@example.com";
  const samplePost = { email, phone: "9876543210", purpose: "login" };

  console.log("BASE_URL:", process.env.BASE_URL);
  console.log("--- Unauthenticated POST probes ---");
  for (const path of CANDIDATE_PATHS) {
    const r = await probePath(publicApi, "POST", path, samplePost);
    if (r.status !== 404) {
      console.log(`POST ${path} -> ${r.status}`, JSON.stringify(r.body).slice(0, 300));
    }
  }

  console.log("\n--- Authenticated GET probes ---");
  for (const path of CANDIDATE_PATHS) {
    const r = await probePath(authed, "GET", path);
    if (r.status !== 404) {
      console.log(`GET ${path} -> ${r.status}`, JSON.stringify(r.body).slice(0, 300));
    }
  }

  await authed.dispose();
  await publicApi.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
