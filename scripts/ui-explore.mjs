/**
 * UI exploration with network capture — credentials via env vars only.
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";

const UI_URL = process.env.UI_URL || "https://indore.bestinfra.app/login";
const UI_USER = process.env.UI_USER;
const UI_PASS = process.env.UI_PASS;

if (!UI_USER || !UI_PASS) {
  console.error("Set UI_USER and UI_PASS.");
  process.exit(1);
}

mkdirSync("reports", { recursive: true });

const report = {
  url: UI_URL,
  exploredAt: new Date().toISOString(),
  login: { network: [] },
  menus: [],
  pages: [],
  errors: [],
};

async function collectLinks(page) {
  return page.evaluate(() => {
    const items = [];
    const seen = new Set();
    document.querySelectorAll("a[href], nav a, aside a, [role='menuitem']").forEach((el) => {
      const text = (el.textContent || "").trim().replace(/\s+/g, " ");
      const href = el.getAttribute("href") || "";
      const key = `${text}|${href}`;
      if (text && !seen.has(key) && text.length < 80) {
        seen.add(key);
        items.push({ text, href });
      }
    });
    return items;
  });
}

async function pageSnapshot(page, label) {
  const url = page.url();
  const title = await page.title();
  const links = await collectLinks(page);
  const hasTable = (await page.locator("table").count()) > 0;
  const hasChart = (await page.locator("canvas, svg.recharts-surface, [class*='chart' i]").count()) > 0;
  const headings = await page.evaluate(() =>
    [...document.querySelectorAll("h1,h2,h3,[class*='title' i]")]
      .map((el) => (el.textContent || "").trim())
      .filter((t) => t.length > 0 && t.length < 100)
      .slice(0, 15),
  );
  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll("[role='tab']")].map((el) => (el.textContent || "").trim()).filter(Boolean),
  );
  const filters = await page.evaluate(() =>
    [...document.querySelectorAll("input, select, [class*='date' i], button")]
      .map((el) => {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent || "").trim().slice(0, 40);
        const ph = el.getAttribute("placeholder") || "";
        const type = el.getAttribute("type") || "";
        return tag === "button" ? `btn:${text}` : `${tag}[${type}] ${ph}`.trim();
      })
      .filter((s) => s.length > 2)
      .slice(0, 25),
  );

  return { label, url, title, headings, tabs, filters, hasTable, hasChart, links: links.slice(0, 40) };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.on("response", async (res) => {
    const u = res.url();
    if (u.includes("auth") || u.includes("login") || u.includes("indore")) {
      let body = "";
      try {
        body = (await res.text()).slice(0, 500);
      } catch {
        body = "<unreadable>";
      }
      report.login.network.push({ url: u, status: res.status(), body });
    }
  });

  try {
    await page.goto(UI_URL, { waitUntil: "networkidle", timeout: 90000 });
    report.login.landingUrl = page.url();

    await page.locator('input[type="email"], input[type="text"]').first().fill(UI_USER);
    await page.locator('input[type="password"]').first().fill(UI_PASS);
    await page.screenshot({ path: "reports/ui-login-before.png" });

    await page.locator('button[type="submit"], button:has-text("Login")').first().click();
    await page.waitForTimeout(8000);
    await page.screenshot({ path: "reports/ui-login-after.png" });

    report.login.afterUrl = page.url();
    report.login.visibleText = await page.locator("body").innerText().then((t) => t.slice(0, 800));
    report.login.success = !page.url().includes("/login");

    if (!report.login.success) {
      const err = page.locator('[class*="error" i], [role="alert"], .text-red, .text-destructive');
      if (await err.count()) {
        report.login.errorText = await err.first().textContent();
      }
    }

    if (report.login.success) {
      report.pages.push(await pageSnapshot(page, "dashboard"));
      report.menus = await collectLinks(page);

      const navHrefs = report.menus
        .filter((l) => l.href && l.href.startsWith("/") && !l.href.includes("login"))
        .map((l) => ({ ...l, href: l.href.split("?")[0] }));

      const unique = [];
      const seen = new Set();
      for (const l of navHrefs) {
        if (!seen.has(l.href)) {
          seen.add(l.href);
          unique.push(l);
        }
      }

      for (const link of unique.slice(0, 30)) {
        try {
          await page.goto(`https://indore.bestinfra.app${link.href}`, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
          });
          await page.waitForTimeout(3000);
          const snap = await pageSnapshot(page, link.text || link.href);
          report.pages.push(snap);

          const tabs = page.locator("[role='tab']");
          const n = await tabs.count();
          for (let i = 0; i < Math.min(n, 10); i++) {
            await tabs.nth(i).click({ timeout: 5000 });
            await page.waitForTimeout(2000);
            const tabLabel = (await tabs.nth(i).textContent())?.trim() || `tab-${i}`;
            report.pages.push(await pageSnapshot(page, `${link.text} > ${tabLabel}`));
          }
        } catch (e) {
          report.errors.push({ page: link.href, error: String(e) });
        }
      }
    }
  } catch (e) {
    report.errors.push({ phase: "main", error: String(e) });
  }

  await browser.close();
  writeFileSync("reports/ui-exploration.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    success: report.login.success,
    afterUrl: report.login.afterUrl,
    pages: report.pages.length,
    network: report.login.network?.length,
    error: report.login.errorText,
  }, null, 2));
}

main();
