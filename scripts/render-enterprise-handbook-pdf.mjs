/**
 * Render `docs/ENTERPRISE-HANDBOOK.md` to the enterprise handbook PDF via Puppeteer.
 *
 * When to run: after editing the handbook markdown, before sharing/publishing.
 *   node scripts/render-enterprise-handbook-pdf.mjs
 *
 * Output:
 *   - `docs/Indoore-Backend-API-Automation-Framework-Enterprise-Handbook-v2.pdf`
 *   - `docs/_handbook-v2-preview.html` (intermediate preview)
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);
const puppeteer = require("puppeteer");

const root = process.cwd();
const mdPath = path.join(root, "docs", "ENTERPRISE-HANDBOOK.md");
const outPdf = path.join(
  root,
  "docs",
  "Indoore-Backend-API-Automation-Framework-Enterprise-Handbook-v2.pdf",
);
const outHtml = path.join(root, "docs", "_handbook-v2-preview.html");

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineFormat(text) {
  let t = escapeHtml(text);
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  t = t.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>',
  );
  return t;
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let inCode = false;
  let codeBuf = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (!tableRows.length) return;
    out.push('<table>');
    tableRows.forEach((row, idx) => {
      const cells = row
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
      if (idx === 1 && cells.every((c) => /^[-:]+$/.test(c))) return;
      const tag = idx === 0 ? "th" : "td";
      out.push(
        "<tr>" +
          cells.map((c) => `<${tag}>${inlineFormat(c)}</${tag}>`).join("") +
          "</tr>",
      );
    });
    out.push("</table>");
    tableRows = [];
    inTable = false;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCode) {
        out.push(
          `<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`,
        );
        codeBuf = [];
        inCode = false;
      } else {
        if (inTable) flushTable();
        inCode = true;
      }
      i += 1;
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      i += 1;
      continue;
    }

    if (line.trim().startsWith("|")) {
      inTable = true;
      tableRows.push(line.trim());
      i += 1;
      continue;
    }
    if (inTable) flushTable();

    if (line.startsWith("# ")) {
      out.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      out.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      out.push(`<h3>${inlineFormat(line.slice(4))}</h3>`);
    } else if (line.startsWith("---")) {
      out.push("<hr />");
    } else if (/^\d+\.\s/.test(line.trim())) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(`<li>${inlineFormat(lines[i].trim().replace(/^\d+\.\s/, ""))}</li>`);
        i += 1;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    } else if (line.trim().startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(`<li>${inlineFormat(lines[i].trim().slice(2))}</li>`);
        i += 1;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    } else if (line.trim() === "") {
      out.push("");
    } else {
      out.push(`<p>${inlineFormat(line)}</p>`);
    }
    i += 1;
  }
  if (inTable) flushTable();
  if (inCode) {
    out.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
  }
  return out.join("\n");
}

const md = fs.readFileSync(mdPath, "utf8");
const body = mdToHtml(md);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Indoore Backend API Automation Framework — Enterprise Handbook v2.0</title>
  <style>
    @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
    :root {
      --ink: #0f172a;
      --muted: #475569;
      --line: #e2e8f0;
      --accent: #0f766e;
      --accent-soft: #ecfdf5;
      --code-bg: #f1f5f9;
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      color: var(--ink);
      font-size: 10.5pt;
      line-height: 1.45;
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      font-size: 18pt;
      color: var(--accent);
      border-bottom: 2px solid var(--accent);
      padding-bottom: 6px;
      margin-top: 28px;
      page-break-after: avoid;
    }
    h2 {
      font-size: 13.5pt;
      color: #115e59;
      margin-top: 22px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 11.5pt;
      color: #134e4a;
      margin-top: 16px;
      page-break-after: avoid;
    }
    p { margin: 8px 0; }
    ul, ol { margin: 6px 0 10px 18px; padding: 0; }
    li { margin: 3px 0; }
    hr {
      border: none;
      border-top: 1px solid var(--line);
      margin: 22px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: var(--accent-soft);
      color: #115e59;
      font-weight: 600;
    }
    tr:nth-child(even) td { background: #f8fafc; }
    code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 9pt;
      background: var(--code-bg);
      padding: 1px 4px;
      border-radius: 3px;
    }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--line);
      border-left: 3px solid var(--accent);
      padding: 10px 12px;
      overflow-x: auto;
      font-size: 8.5pt;
      line-height: 1.35;
      page-break-inside: avoid;
    }
    pre code { background: transparent; padding: 0; }
    a { color: var(--accent); text-decoration: none; }
    .cover {
      border: 1px solid var(--line);
      background: linear-gradient(160deg, #ecfdf5 0%, #ffffff 55%);
      padding: 28px 24px;
      margin-bottom: 28px;
      page-break-after: always;
    }
    .cover .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 9pt;
      color: var(--muted);
      margin-bottom: 10px;
    }
    .cover h1 {
      border: none;
      font-size: 22pt;
      margin: 0 0 8px;
    }
    .cover .subtitle {
      font-size: 12pt;
      color: var(--muted);
      margin-bottom: 18px;
    }
    .meta {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 4px 12px;
      font-size: 10pt;
    }
    .meta span:nth-child(odd) { color: var(--muted); font-weight: 600; }
    .footer-note {
      margin-top: 28px;
      padding-top: 10px;
      border-top: 1px solid var(--line);
      font-size: 8.5pt;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <section class="cover">
    <div class="eyebrow">Enterprise Architecture &amp; Engineering Handbook</div>
    <h1>Indoore Backend API Automation Framework</h1>
    <div class="subtitle">A layered, standards-based approach to enterprise backend quality assurance for Indoore MDMS</div>
    <div class="meta">
      <span>Version</span><span>2.0 · July 2026</span>
      <span>Classification</span><span>Confidential — Internal Engineering Use</span>
      <span>Prepared by</span><span>Vamsi Krishna · QA Automation Engineer</span>
      <span>Product ref</span><span>MDM Presentation_23.12.2025.pdf (131 pages)</span>
      <span>Stack</span><span>Playwright · TypeScript · Node.js · PostgreSQL · Zod · GitHub Actions · Allure</span>
      <span>Volumes</span><span>1–6 (Foundation · Core · Pillars · Modules · CI/CD · Delivery &amp; MDM Alignment)</span>
    </div>
  </section>
  ${body}
  <div class="footer-note">
    Generated from docs/ENTERPRISE-HANDBOOK.md · Supersedes handbook PDF v1.0 · Do not distribute externally without approval.
  </div>
</body>
</html>`;

fs.writeFileSync(outHtml, html, "utf8");

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
await page.goto(pathToFileURL(outHtml).href, {
  waitUntil: "networkidle0",
});
await page.pdf({
  path: outPdf,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate:
    '<div style="font-size:8px;width:100%;padding:0 16mm;color:#64748b;font-family:Segoe UI,Arial;">Indoore Backend API Automation Framework — Enterprise Handbook v2.0</div>',
  footerTemplate:
    '<div style="font-size:8px;width:100%;padding:0 16mm;color:#64748b;font-family:Segoe UI,Arial;display:flex;justify-content:space-between;"><span>Confidential — Internal Use</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
  margin: { top: "18mm", bottom: "18mm", left: "14mm", right: "14mm" },
});
await browser.close();

console.log("Wrote", outPdf);
