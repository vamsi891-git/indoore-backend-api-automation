import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const base = process.env.BASE_URL;
const tokenPath = "playwright/.auth/token.json";
const headers = { Accept: "application/json" };
if (fs.existsSync(tokenPath)) {
  const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  headers.Authorization = `Bearer ${token.accessToken}`;
}

async function get(path) {
  const res = await fetch(`${base}${path}`, { headers });
  return { status: res.status, body: await res.json() };
}

for (const path of [
  "/indore/billing/billing-data?month=12&year=2025&page=1&limit=2",
  "/indore/billing/daywise-billing-data?month=12&year=2025&includeTotal=false&page=1&limit=2",
]) {
  const { status, body } = await get(path);
  console.log("\n===", path, "status", status, "===");
  console.log("top:", Object.keys(body));
  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    console.log("data:", Object.keys(body.data));
  }
  console.log(JSON.stringify(body, null, 2).slice(0, 5000));
}
