import fs from "fs";
import path from "path";
const resultsPath = path.join(process.cwd(), "reports", "playwright-results.json");
function readSummary() {
  if (!fs.existsSync(resultsPath)) {
    return { total: "?", passed: "?", failed: "?", skipped: "?", flaky: "?" };
  }
  try {
    const data = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
    const stats = data.stats ?? {};
    const passed = stats.expected ?? stats.passed;
    const failed = stats.unexpected ?? stats.failed;
    const skipped = stats.skipped ?? 0;
    const flaky = stats.flaky ?? 0;
    const total =
      stats.tests ??
      (typeof passed === "number" && typeof failed === "number"
        ? passed + failed + skipped + flaky
        : "?");
    return {
      total,
      passed: passed ?? "?",
      failed: failed ?? "?",
      skipped,
      flaky,
      durationMs: stats.duration ?? null,
    };
  } catch {
    return { total: "?", passed: "?", failed: "?", skipped: "?", flaky: "?" };
  }
}

function defaultPagesUrl() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    return "";
  }
  const [owner, name] = repo.split("/");
  return owner && name ? `https://${owner}.github.io/${name}/` : "";
}

const summary = readSummary();
const duration =
  summary.durationMs != null
    ? `${Math.round(summary.durationMs / 1000)}s`
    : "n/a";

const moduleName = process.env.MODULE_NAME?.trim();
const moduleScope = process.env.MODULE_SCOPE?.trim();
const moduleRows =
  moduleName
    ? `<tr><td><b>Module</b></td><td>${moduleName}</td></tr>
    <tr><td><b>Scope</b></td><td>${moduleScope || "all"}</td></tr>`
    : "";

const allureUrl =
  process.env.ALLURE_REPORT_URL?.trim() || defaultPagesUrl();

const runUrl =
  process.env.GITHUB_SERVER_URL &&
  process.env.GITHUB_REPOSITORY &&
  process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : "";

const allureLinkBlock = allureUrl
  ? `<p style="margin:20px 0;">
      <a href="${allureUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
        View Allure Report Online
      </a>
    </p>
    <p><b>Report URL:</b> <a href="${allureUrl}">${allureUrl}</a></p>
    <p><i>Open this link in Chrome/Edge — do not download and double-click index.html (shows empty dashboard).</i></p>`
  : `<p><b>Allure online URL not available yet.</b> Enable GitHub Pages (Settings → Pages → Source: GitHub Actions), then re-run the workflow.</p>`;

const html = `<!DOCTYPE html>
<html>
<body style="font-family:Segoe UI,Arial,sans-serif;color:#222;max-width:720px;">
  <h2>Playwright API Test Report</h2>
  <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;width:100%;">
    <tr><td><b>Repository</b></td><td>${process.env.GITHUB_REPOSITORY ?? "local"}</td></tr>
    <tr><td><b>Branch</b></td><td>${process.env.GITHUB_REF_NAME ?? "local"}</td></tr>
    <tr><td><b>Commit</b></td><td>${(process.env.GITHUB_SHA ?? "local").slice(0, 7)}</td></tr>
    ${moduleRows}
    <tr><td><b>Test run result</b></td><td>${process.env.WORKFLOW_JOB_STATUS ?? "unknown"}</td></tr>
    <tr><td><b>Total tests</b></td><td>${summary.total}</td></tr>
    <tr><td><b>Passed</b></td><td style="color:#0a7a2f;">${summary.passed}</td></tr>
    <tr><td><b>Failed</b></td><td style="color:#b00020;">${summary.failed}</td></tr>
    <tr><td><b>Skipped</b></td><td>${summary.skipped}</td></tr>
    <tr><td><b>Flaky</b></td><td>${summary.flaky}</td></tr>
    <tr><td><b>Duration</b></td><td>${duration}</td></tr>
  </table>

  <h3>Allure dashboard (recommended)</h3>
  ${allureLinkBlock}

  <h3>Backup: download from GitHub</h3>
  <p>If the online link does not work, download the <b>allure-report</b> artifact from the Actions run and run <code>npx allure open .</code> (requires Java).</p>
  ${runUrl ? `<p><a href="${runUrl}">Open GitHub Actions run</a></p>` : ""}
</body>
</html>`;

const outPath = path.join(process.cwd(), "reports", "allure-email-body.html");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, "utf8");
