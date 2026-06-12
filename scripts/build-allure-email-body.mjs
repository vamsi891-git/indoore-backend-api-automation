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
    return {
      total: stats.expected ?? stats.tests ?? "?",
      passed: stats.passed ?? "?",
      failed: stats.failed ?? stats.unexpected ?? "?",
      skipped: stats.skipped ?? "?",
      flaky: stats.flaky ?? 0,
      durationMs: stats.duration ?? null,
    };
  } catch {
    return { total: "?", passed: "?", failed: "?", skipped: "?", flaky: "?" };
  }
}

const summary = readSummary();
const duration =
  summary.durationMs != null
    ? `${Math.round(summary.durationMs / 1000)}s`
  : "n/a";

const html = `<!DOCTYPE html>
<html>
<body style="font-family:Segoe UI,Arial,sans-serif;color:#222;">
  <h2>Playwright API Test Report</h2>
  <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;">
    <tr><td><b>Repository</b></td><td>${process.env.GITHUB_REPOSITORY ?? "local"}</td></tr>
    <tr><td><b>Branch</b></td><td>${process.env.GITHUB_REF_NAME ?? "local"}</td></tr>
    <tr><td><b>Commit</b></td><td>${process.env.GITHUB_SHA ?? "local"}</td></tr>
    <tr><td><b>Workflow status</b></td><td>${process.env.WORKFLOW_JOB_STATUS ?? "unknown"}</td></tr>
    <tr><td><b>Total tests</b></td><td>${summary.total}</td></tr>
    <tr><td><b>Passed</b></td><td style="color:#0a7a2f;">${summary.passed}</td></tr>
    <tr><td><b>Failed</b></td><td style="color:#b00020;">${summary.failed}</td></tr>
    <tr><td><b>Skipped</b></td><td>${summary.skipped}</td></tr>
    <tr><td><b>Flaky</b></td><td>${summary.flaky}</td></tr>
    <tr><td><b>Duration</b></td><td>${duration}</td></tr>
  </table>
  <p>The <b>Allure HTML report</b> is attached as <code>allure-report.zip</code>.
  Unzip and open <code>index.html</code> in a browser.</p>
  ${
    process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `<p><a href="${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}">Open GitHub Actions run</a></p>`
      : ""
  }
</body>
</html>`;

const outPath = path.join(process.cwd(), "reports", "allure-email-body.html");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, "utf8");
