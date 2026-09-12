import "dotenv/config";
import { request } from "@playwright/test";

function resolveApiPath(p) {
  const strip = ["1", "true", "yes"].includes(
    String(process.env.STRIP_INDORE_PREFIX || "").trim().toLowerCase(),
  );
  if (!strip) return p;
  return p.startsWith("/indore/") ? p.slice("/indore".length) : p;
}

async function login(api) {
  const loginPath = resolveApiPath("/indore/auth/login");
  await api.get(loginPath);
  let csrf = (await api.storageState()).cookies.find((c) => c.name === "csrf_token")?.value;
  let res = await api.post(loginPath, {
    headers: { Accept: "application/json", "Content-Type": "application/json", "x-csrf-token": csrf },
    data: { email: process.env.EMAIL, password: process.env.PASSWORD },
  });
  let json = await res.json();
  let data = json?.data || {};
  let token = data.accessToken;
  const keep = process.env.DEVICE_ID?.trim();
  let g = 0;
  while (data.requiresDeviceSelection && !token && g++ < 8) {
    const devices = [...(data.devices || [])].sort(
      (a, b) => (Date.parse(a.lastSeenAt || "") || 0) - (Date.parse(b.lastSeenAt || "") || 0),
    );
    const releasable = keep ? devices.filter((d) => d.id !== keep) : devices;
    const deviceId = (releasable[0] || devices[0])?.id;
    csrf = (await api.storageState()).cookies.find((c) => c.name === "csrf_token")?.value || csrf;
    const rel = await api.post(resolveApiPath("/indore/auth/login/release-device"), {
      headers: { Accept: "application/json", "Content-Type": "application/json", "x-csrf-token": csrf },
      data: { challengeToken: data.challengeToken, deviceId },
    });
    data = (await rel.json())?.data || {};
    token = data.accessToken;
  }
  if (!token) throw new Error("no token");
  csrf = (await api.storageState()).cookies.find((c) => c.name === "csrf_token")?.value || csrf;
  return { token, csrf };
}

async function main() {
  const api = await request.newContext({ baseURL: process.env.BASE_URL });
  const { token, csrf } = await login(api);
  const h = { Authorization: `Bearer ${token}`, "x-csrf-token": csrf, Accept: "application/json" };
  async function get(p) {
    const r = await api.get(resolveApiPath(p), { headers: h });
    return { status: r.status(), body: await r.json() };
  }

  const ivrs = "N3374018980";
  const bp = await get(`/indore/consumers/${encodeURIComponent("3543025952")}/billing-period`);
  console.log("=== billing-period", bp.status);
  console.log(JSON.stringify(bp.body?.data, null, 2)?.slice(0, 1500));

  const bh = await get(`/indore/consumers/${ivrs}/billing-history?billingLimit=0`);
  console.log("=== billing-history", bh.status, "len", Array.isArray(bh.body?.data) ? bh.body.data.length : typeof bh.body?.data);
  console.log(JSON.stringify(bh.body?.data?.[0] ?? bh.body).slice(0, 400));

  const cs = await get(`/indore/consumers/1019258045/communication-status?date=2026-06-22`);
  console.log("=== comm-status keys", Object.keys(cs.body?.data || {}));

  const elc = await get(`/indore/consumers/${ivrs}/event-log/cards`);
  console.log("=== event-log-cards", elc.status, JSON.stringify(elc.body).slice(0, 800));

  const llp = await get(`/indore/consumers/${ivrs}/live-load-profile`);
  console.log("=== live-load", JSON.stringify(llp.body?.data).slice(0, 600));

  const near = await get(`/indore/consumers/nearest-account-ids?accountId=N3374018980&limit=5`);
  console.log("=== nearest", near.status, JSON.stringify(near.body).slice(0, 400));

  await api.dispose();
}
main().catch((e) => { console.error(e); process.exit(1); });
