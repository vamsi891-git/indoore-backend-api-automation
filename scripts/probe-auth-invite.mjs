import dotenv from "dotenv";
import fs from "fs";
import { request } from "@playwright/test";

dotenv.config();

const base = process.env.BASE_URL;
const headers = { Accept: "application/json", "Content-Type": "application/json" };
if (fs.existsSync("playwright/.auth/token.json")) {
  const token = JSON.parse(fs.readFileSync("playwright/.auth/token.json", "utf8"));
  headers.Authorization = `Bearer ${token.accessToken}`;
  if (token.csrfToken) headers["x-csrf-token"] = token.csrfToken;
}

const ctx = await request.newContext({
  baseURL: base,
  extraHTTPHeaders: { Accept: "application/json" },
});
await ctx.get("/indore/auth/login");
const csrf =
  (await ctx.storageState()).cookies.find((c) => c.name === "csrf_token")?.value ?? "";
const authHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "x-csrf-token": csrf,
  Cookie: `csrf_token=${csrf}`,
  ...(headers.Authorization ? { Authorization: headers.Authorization } : {}),
};

const getPaths = [
  "/indore/auth/invite/sent?page=1&limit=5",
  "/indore/auth/invite/list?page=1&limit=5",
  "/indore/auth/invitations?page=1&limit=5",
  "/indore/auth/me/invitations?page=1&limit=5",
  "/indore/auth/invite/preview?token=invalid-token-probe-1234567890",
];
for (const path of getPaths) {
  const res = await ctx.get(path, { headers: authHeaders });
  const text = await res.text();
  console.log("\n=== GET", path, res.status(), "===");
  console.log(text.slice(0, 600));
}

const inviteBody = {
  email: `probe-${Date.now()}@example.com`,
  role: "manager",
};
const inviteRes = await ctx.post("/indore/auth/invite", {
  headers: authHeaders,
  data: {
    email: `automation-probe-${Date.now()}@example.com`,
    role: "Manager",
  },
});
const inviteText = await inviteRes.text();
console.log("\n=== POST invite Manager", inviteRes.status(), "===");
console.log(inviteText);
let invitationId = "";
try {
  invitationId = JSON.parse(inviteText).data?.invitationId ?? "";
} catch {}

const moreGetPaths = [
  "/indore/auth/invite/sent-invitations?page=1&limit=5",
  "/indore/auth/invitations/sent?page=1&limit=5",
  "/indore/auth/invite/mine?page=1&limit=5",
];
for (const path of moreGetPaths) {
  const res = await ctx.get(path, { headers: authHeaders });
  const text = await res.text();
  if (!text.includes("Cannot GET")) {
    console.log("\n=== GET", path, res.status(), "===");
    console.log(text.slice(0, 600));
  }
}

if (invitationId) {
  for (const path of [
    `/indore/auth/invite/${invitationId}/resend`,
    `/indore/auth/invitations/${invitationId}/resend`,
  ]) {
    const res = await ctx.post(path, { headers: authHeaders });
    console.log("\n=== POST", path, res.status(), "===");
    console.log((await res.text()).slice(0, 400));
  }
  for (const path of [
    `/indore/auth/invite/${invitationId}`,
    `/indore/auth/invitations/${invitationId}`,
  ]) {
    const res = await ctx.delete(path, { headers: authHeaders });
    console.log("\n=== DELETE", path, res.status(), "===");
    console.log((await res.text()).slice(0, 200));
  }
}
await ctx.dispose();
