/**
 * Generate shareable PDF from reports/mdm-pdf-vs-test-cases.md
 * Run: node scripts/generate-report-pdf.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, "..");
const MD_PATH = path.join(ROOT, process.argv[2] ?? "reports/mdm-pdf-vs-test-cases.md");
const PDF_PATH = path.join(
  ROOT,
  process.argv[3] ?? MD_PATH.replace(/\.md$/i, ".pdf"),
);

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Minimal markdown → HTML (headings, tables, lists, blockquote, hr, bold, code, paragraphs) */
function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;

  const flushParagraph = (buf) => {
    if (!buf.length) return;
    let text = buf.join(" ").trim();
    if (!text) return;
    text = inlineFormat(text);
    out.push(`<p>${text}</p>`);
  };

  const inlineFormat = (s) => {
    let t = escapeHtml(s);
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    return t;
  };

  let paraBuf = [];

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      flushParagraph(paraBuf);
      paraBuf = [];
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++;
      out.push(`<pre><code>${codeLines.join("\n")}</code></pre>`);
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      flushParagraph(paraBuf);
      paraBuf = [];
      const level = line.match(/^#+/)[0].length;
      const text = inlineFormat(line.replace(/^#+\s*/, ""));
      out.push(`<h${level}>${text}</h${level}>`);
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushParagraph(paraBuf);
      paraBuf = [];
      out.push("<hr/>");
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph(paraBuf);
      paraBuf = [];
      const quoteLines = [];
      while (i < lines.length && (lines[i].startsWith("> ") || lines[i] === ">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${inlineFormat(quoteLines.join(" "))}</blockquote>`);
      continue;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      flushParagraph(paraBuf);
      paraBuf = [];
      const tableLines = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2 && /^\|[\s\-:|]+\|$/.test(tableLines[1])) {
        const headers = tableLines[0]
          .split("|")
          .slice(1, -1)
          .map((c) => inlineFormat(c.trim()));
        const rows = tableLines.slice(2).map((row) =>
          row
            .split("|")
            .slice(1, -1)
            .map((c) => inlineFormat(c.trim())),
        );
        out.push("<table><thead><tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr></thead><tbody>");
        rows.forEach((row) => {
          out.push("<tr>" + row.map((c) => `<td>${c}</td>`).join("") + "</tr>");
        });
        out.push("</tbody></table>");
      }
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      flushParagraph(paraBuf);
      paraBuf = [];
      out.push("<ol>");
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        out.push(`<li>${inlineFormat(lines[i].replace(/^\d+\.\s*/, ""))}</li>`);
        i++;
      }
      out.push("</ol>");
      continue;
    }

    if (/^-\s/.test(line)) {
      flushParagraph(paraBuf);
      paraBuf = [];
      out.push("<ul>");
      while (i < lines.length && /^-\s/.test(lines[i])) {
        out.push(`<li>${inlineFormat(lines[i].replace(/^-\s*/, ""))}</li>`);
        i++;
      }
      out.push("</ul>");
      continue;
    }

    if (line.trim() === "") {
      flushParagraph(paraBuf);
      paraBuf = [];
      i++;
      continue;
    }

    if (/^\*[^*].*\*$/.test(line.trim()) && !line.includes("**")) {
      flushParagraph(paraBuf);
      paraBuf = [];
      out.push(`<p class="footer-note">${inlineFormat(line.trim().replace(/^\*|\*$/g, ""))}</p>`);
      i++;
      continue;
    }

    paraBuf.push(line.trim());
    i++;
  }

  flushParagraph(paraBuf);
  return out.join("\n");
}

function extractCoverMeta(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let title = "Report";
  let subtitle = "";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^#\s+/.test(line)) {
      title = line.replace(/^#\s+/, "").trim();
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next === "" || next.startsWith("|")) continue;
        if (/^\*\*(.+)\*\*$/.test(next)) {
          subtitle = next.replace(/^\*\*|\*\*$/g, "");
          break;
        }
        if (!next.startsWith("#")) {
          subtitle = next.replace(/\*\*/g, "");
          break;
        }
        break;
      }
      break;
    }
  }
  return { title, subtitle };
}

function buildHtml(body, meta) {
  const generated = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const title = meta?.title ?? "Report";
  const subtitle = meta?.subtitle ?? "";
  const footerLabel = meta?.footer ?? title;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 18mm 14mm 20mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #1a1a1a;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    .cover {
      border-bottom: 3px solid #1f4e78;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .cover h1 {
      color: #1f4e78;
      font-size: 22pt;
      margin: 0 0 8px 0;
      line-height: 1.2;
    }
    .meta {
      color: #555;
      font-size: 10pt;
      margin: 4px 0;
    }
    h1 { color: #1f4e78; font-size: 18pt; margin-top: 28px; }
    h2 { color: #1f4e78; font-size: 14pt; margin-top: 22px; border-bottom: 1px solid #d9e1f2; padding-bottom: 4px; }
    h3 { color: #2e5f8a; font-size: 12pt; margin-top: 16px; }
    p { margin: 8px 0; }
    blockquote {
      border-left: 4px solid #1f4e78;
      margin: 12px 0;
      padding: 8px 12px;
      background: #f5f8fc;
      color: #333;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    th {
      background: #1f4e78;
      color: #fff;
      text-align: left;
      padding: 7px 8px;
      font-weight: 600;
    }
    td {
      border: 1px solid #cfd8e3;
      padding: 6px 8px;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #f8fafc; }
    code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 9pt;
      background: #eef2f7;
      padding: 1px 4px;
      border-radius: 3px;
    }
    pre {
      background: #f4f6f8;
      padding: 10px;
      overflow-x: auto;
      font-size: 9pt;
    }
    ul, ol { margin: 8px 0 12px 20px; }
    li { margin: 4px 0; }
    hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
    .footer-note {
      font-size: 9pt;
      color: #666;
      font-style: italic;
      margin-top: 24px;
    }
    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 8pt;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="meta"><strong>${escapeHtml(subtitle)}</strong></p>` : ""}
    <p class="meta">Project: Indoore MDMS Backend API Automation</p>
    <p class="meta">Generated: ${generated}</p>
  </div>
  ${body}
</body>
</html>`;
}

async function main() {
  const md = fs.readFileSync(MD_PATH, "utf8");
  const coverMeta = extractCoverMeta(md);
  const body = markdownToHtml(md);
  const html = buildHtml(body, {
    title: coverMeta.title,
    subtitle: coverMeta.subtitle,
    footer: path.basename(PDF_PATH, ".pdf"),
  });
  const htmlPath = PDF_PATH.replace(/\.pdf$/i, ".html");
  fs.writeFileSync(htmlPath, html, "utf8");

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({
    path: PDF_PATH,
    format: "A4",
    printBackground: true,
    margin: { top: "14mm", right: "12mm", bottom: "16mm", left: "12mm" },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate:
      `<div style="width:100%;font-size:8px;text-align:center;color:#888;padding:0 12mm;">Indoore MDMS — ${escapeHtml(coverMeta.title)} · Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
  });
  await browser.close();

  const stat = fs.statSync(PDF_PATH);
  console.log(`PDF created: ${PDF_PATH}`);
  console.log(`Size: ${(stat.size / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
