import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const base = process.env.BASE_URL;
const tokenPath = "playwright/.auth/token.json";
const headers = { Accept: "application/json" };
if (fs.existsSync(tokenPath)) {
  const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  headers.Authorization = `Bearer ${token.accessToken}`;
} else {
  console.error("Missing", tokenPath, "- run a login/setup first");
  process.exit(1);
}

async function get(path) {
  const res = await fetch(`${base}${path}`, { headers });
  let body;
  try {
    body = await res.json();
  } catch {
    body = { _raw: await res.text() };
  }
  return { status: res.status, body };
}

const refs = [
  "0022479",
  "N0022479",
  "N3472031547",
  "5633025000",
];

for (const ref of refs) {
  for (const ep of ["profile", "real-time-power"]) {
    const path = `/indore/consumers/${encodeURIComponent(ref)}/${ep}`;
    const { status, body } = await get(path);
    console.log("\n===", path, "status", status, "===");
    if (ep === "profile" && body?.data) {
      console.log(
        JSON.stringify(
          {
            success: body.success,
            uniqueId: body.data.uniqueId,
            consumerNumber: body.data.consumerNumber,
            meterSerialNumber: body.data.meterSerialNumber,
            meterPhase: body.data.connectionMeterDetails?.meterPhase,
            ivrsNo: body.data.connectionDetails?.ivrsNo,
          },
          null,
          2,
        ),
      );
    } else {
      console.log(JSON.stringify(body, null, 2).slice(0, 3000));
    }
  }
}
