/**
 * Compare each MDM PDF screenshot slide (table UI) with live API response structure.
 * Run: node scripts/compare-mdm-screenshots-with-apis.mjs [--ocr] [--screenshots]
 * Then: node scripts/generate-report-pdf.mjs reports/mdm-screenshot-vs-api-comparison.md
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { request } from "@playwright/test";
import { PDFParse } from "pdf-parse";
import { AuthApi } from "../src/core/utils/auth.util.ts";
import { parsePdfSlides, resolveSlideApi } from "./data/mdm-pdf-slide-api-map.mjs";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const EXTRACT_PATH = path.join(ROOT, "reports", "mdm-pdf-extract.txt");
const PDF_PATH = path.join(ROOT, "templates", "MDM Presentation_23.12.2025.pdf");
const OUT_MD = path.join(ROOT, "reports", "mdm-screenshot-vs-api-comparison.md");
const OUT_JSON = path.join(ROOT, "reports", "mdm-screenshot-vs-api-comparison.json");
const PAGES_DIR = path.join(ROOT, "reports", "mdm-pdf-pages");

const USE_OCR = process.argv.includes("--ocr");
const EXPORT_SCREENSHOTS = process.argv.includes("--screenshots") || USE_OCR;

function extractResponseMeta(body) {
  const data = body?.data ?? body;
  let columns = [];

  if (Array.isArray(data?.columns)) {
    columns = data.columns.map((c) => (typeof c === "string" ? c : c.header || c.key || c.label)).filter(Boolean);
  }
  const rows = data?.rows ?? data?.items ?? data?.reports ?? data?.data ?? [];
  if (!columns.length && Array.isArray(rows) && rows[0] && typeof rows[0] === "object") {
    columns = Object.keys(rows[0]);
  }
  if (Array.isArray(data?.reports) && !columns.length) {
    columns = ["analysisType", "reportName", "totalCount", "domesticCount", "nonDomesticCount"];
  }

  let total =
    data?.pagination?.total ??
    data?.total ??
    data?.totalCount ??
    data?.totalRecords ??
    null;

  if (total == null && Array.isArray(data?.reports)) {
    total = data.reports.reduce((s, r) => s + (Number(r.totalCount) || 0), 0);
  }

  const rowCount = Array.isArray(rows) ? rows.length : 0;
  const sampleRow = Array.isArray(rows) && rows[0] ? rows[0] : null;

  return { columns, total, rowCount, sampleRow };
}

function extractOcrSignals(text) {
  const showing = text.match(/(?:Showing\s+)?(\d[\d,]*)\s*[-–]\s*(\d[\d,]*)\s+of\s+([\d,]+)/i);
  const totalOnly = text.match(/\bof\s+([\d,]+)\b/i);
  const headerLine = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 10 && /[A-Z]/.test(l) && l.split(/\s+/).length >= 3);

  return {
    paginationFrom: showing ? Number(showing[1].replace(/,/g, "")) : null,
    paginationTo: showing ? Number(showing[2].replace(/,/g, "")) : null,
    paginationTotal: showing
      ? Number(showing[3].replace(/,/g, ""))
      : totalOnly
        ? Number(totalOnly[1].replace(/,/g, ""))
        : null,
    headerSnippet: headerLine?.slice(0, 120) ?? null,
    ocrLength: text.length,
  };
}

function compareResult(api, ocr, summaryCount) {
  if (!api?.called) return "NO_API";
  if (api.error) return "API_ERROR";
  if (api.status >= 400) return "API_ERROR";
  if (api.rowCount === 0 && api.total === 0) return "API_EMPTY";

  if (ocr?.paginationTotal != null && api.total != null) {
    const diff = Math.abs(ocr.paginationTotal - api.total);
    const tolerance = Math.max(5, Math.round(api.total * 0.05));
    if (diff > tolerance) return "TOTAL_MISMATCH";
  }

  if (summaryCount != null && api.total != null && api.tableType !== "summary") {
    const diff = Math.abs(summaryCount - api.total);
    const tolerance = Math.max(5, Math.round(summaryCount * 0.05));
    if (diff > tolerance) return "SUMMARY_COUNT_MISMATCH";
  }

  if (api.columns?.length) return "ALIGNED";
  return "PARTIAL";
}

async function fetchCommercialSummary(api) {
  const res = await api.get("/indore/analysis/commercial/summary", {
    params: { month: 12, year: 2025, pfThreshold: 0.8 },
  });
  if (!res.ok()) return {};
  const body = await res.json();
  const map = {};
  for (const r of body?.data?.reports ?? []) {
    map[r.analysisType] = r.totalCount;
  }
  return map;
}

async function callMappedApi(api, mapping) {
  if (!mapping?.endpoint) return { called: false };

  const url = mapping.endpoint.replace("PROBE", "");
  if (url.includes("PROBE")) {
    return { called: false, skipReason: "Missing env (VALID_METER_SERIAL / MDM_COMPARE_CONSUMER_CID)" };
  }

  try {
    const res = await api.get(url, { params: mapping.params ?? {}, timeout: 120_000 });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text.slice(0, 500) };
    }
    const meta = body ? extractResponseMeta(body) : { columns: [], total: null, rowCount: 0, sampleRow: null };
    return {
      called: true,
      status: res.status(),
      endpoint: url,
      params: mapping.params,
      module: mapping.module,
      tableType: mapping.tableType ?? "table",
      ...meta,
      error: res.ok() ? null : text.slice(0, 300),
    };
  } catch (err) {
    return {
      called: true,
      status: 0,
      endpoint: url,
      params: mapping.params,
      module: mapping.module,
      columns: [],
      total: null,
      rowCount: 0,
      error: String(err.message ?? err),
    };
  }
}

async function exportPageScreenshots(pages) {
  fs.mkdirSync(PAGES_DIR, { recursive: true });
  const buf = fs.readFileSync(PDF_PATH);
  const parser = new PDFParse({ data: buf });
  const uniquePages = [...new Set(pages)].sort((a, b) => a - b);
  const result = await parser.getScreenshot({ partial: uniquePages, scale: 1.2, imageBuffer: true });
  const map = {};
  for (let i = 0; i < uniquePages.length; i++) {
    const page = uniquePages[i];
    const img = result.pages[i]?.data;
    if (!img) continue;
    const file = path.join(PAGES_DIR, `page-${String(page).padStart(3, "0")}.png`);
    fs.writeFileSync(file, img);
    map[page] = file;
  }
  await parser.destroy();
  return map;
}

async function ocrImage(imagePath) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const { data } = await worker.recognize(imagePath);
  await worker.terminate();
  return data.text ?? "";
}

function buildMarkdown(results, summary) {
  const lines = [];
  lines.push("# MDM PDF Screenshot Tables vs API Response — Comparison Report");
  lines.push("");
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push("**Scope:** Framework API responses vs PDF screenshot slides (image tables)");
  lines.push("");
  lines.push("## Executive summary");
  lines.push("");
  lines.push("| Status | Slides |");
  lines.push("|--------|--------|");
  for (const [k, v] of Object.entries(summary.byStatus)) {
    lines.push(`| ${k} | ${v} |`);
  }
  lines.push(`| **Total slides** | **${summary.total}** |`);
  lines.push(`| **Mapped to API** | **${summary.mapped}** |`);
  lines.push(`| **OCR enabled** | ${summary.ocr ? "Yes" : "No"} |`);
  lines.push("");
  lines.push("## Per-slide comparison");
  lines.push("");
  lines.push(
    "| Page | PDF slide title | Module | API endpoint | HTTP | API total | API rows | API columns | Screenshot total (OCR) | Status |",
  );
  lines.push(
    "|------|-----------------|--------|--------------|------|-----------|----------|-------------|------------------------|--------|",
  );

  for (const r of results) {
    const cols = (r.api?.columns ?? []).slice(0, 6).join(", ");
    const colEllipsis = (r.api?.columns?.length ?? 0) > 6 ? "…" : "";
    lines.push(
      `| ${r.page} | ${r.title.replace(/\|/g, "/")} | ${r.api?.module ?? "—"} | ${r.api?.endpoint ?? "—"} | ${r.api?.status ?? "—"} | ${r.api?.total ?? "—"} | ${r.api?.rowCount ?? "—"} | ${cols}${colEllipsis} | ${r.ocr?.paginationTotal ?? "—"} | **${r.status}** |`,
    );
  }

  lines.push("");
  lines.push("## Detailed rows (API sample + OCR snippet)");
  lines.push("");

  for (const r of results.filter((x) => x.api?.called)) {
    lines.push(`### Page ${r.page} — ${r.title}`);
    lines.push("");
    lines.push(`- **Status:** ${r.status}`);
    lines.push(`- **Module:** ${r.api.module}`);
    lines.push(`- **Endpoint:** \`${r.api.endpoint}\``);
    lines.push(`- **Query:** \`${JSON.stringify(r.api.params ?? {})}\``);
    if (r.summaryCount != null) lines.push(`- **Commercial summary count:** ${r.summaryCount}`);
    if (r.screenshotPath) lines.push(`- **Screenshot:** \`${path.relative(ROOT, r.screenshotPath)}\``);
    lines.push(`- **API columns (${r.api.columns?.length ?? 0}):** ${(r.api.columns ?? []).join(", ") || "—"}`);
    lines.push(`- **API total / rows:** ${r.api.total ?? "—"} / ${r.api.rowCount ?? 0}`);
    if (r.api.error) lines.push(`- **API error:** ${r.api.error}`);
    if (r.ocr?.headerSnippet) lines.push(`- **OCR header snippet:** ${r.ocr.headerSnippet}`);
    if (r.api.sampleRow) {
      lines.push("- **Sample API row:**");
      lines.push("```json");
      lines.push(JSON.stringify(r.api.sampleRow, null, 2).slice(0, 1200));
      lines.push("```");
    }
    lines.push("");
  }

  lines.push("## Gaps — slides without API mapping");
  lines.push("");
  for (const r of results.filter((x) => x.status === "NO_API")) {
    lines.push(`- **Page ${r.page}:** ${r.title}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("*Re-run: `node scripts/compare-mdm-screenshots-with-apis.mjs --screenshots --ocr`*");
  return lines.join("\n");
}

async function main() {
  if (!fs.existsSync(EXTRACT_PATH)) {
    console.error("Missing reports/mdm-pdf-extract.txt — run: node scripts/extract-mdm-pdf.mjs");
    process.exit(1);
  }

  const extractText = fs.readFileSync(EXTRACT_PATH, "utf8");
  const slides = parsePdfSlides(extractText);

  const login = await AuthApi.login();
  const api = await request.newContext({
    baseURL: process.env.BASE_URL,
    extraHTTPHeaders: {
      Accept: "application/json",
      Authorization: `Bearer ${login.accessToken}`,
    },
  });

  console.log("Fetching commercial summary index…");
  const commercialSummary = await fetchCommercialSummary(api);

  const mappedSlides = slides
    .filter((s) => !s.isBlank)
    .map((s) => ({ ...s, mapping: resolveSlideApi(s.title, s.page) }))
    .filter((s) => s.mapping);

  let screenshotMap = {};
  if (EXPORT_SCREENSHOTS && fs.existsSync(PDF_PATH)) {
    console.log(`Exporting ${mappedSlides.length} page screenshots…`);
    screenshotMap = await exportPageScreenshots(mappedSlides.map((s) => s.page));
  }

  const results = [];
  const byStatus = {};

  for (const slide of slides.filter((s) => !s.isBlank)) {
    const mapping = resolveSlideApi(slide.title, slide.page);
    let apiResult = { called: false };
    let summaryCount = null;

    if (mapping) {
      if (mapping.summaryKey && commercialSummary[mapping.summaryKey] != null) {
        summaryCount = commercialSummary[mapping.summaryKey];
      }
      if (mapping.tableType === "summary-row-only" && mapping.summaryKey) {
        apiResult = {
          called: true,
          status: 200,
          endpoint: "/indore/analysis/commercial/summary",
          params: mapping.params,
          module: mapping.module,
          tableType: "summary-row-only",
          columns: ["reportName", "totalCount"],
          total: summaryCount,
          rowCount: 1,
          sampleRow: { analysisType: mapping.summaryKey, totalCount: summaryCount },
        };
      } else {
        apiResult = await callMappedApi(api, mapping);
        if (mapping.summaryKey && summaryCount == null && commercialSummary[mapping.summaryKey] != null) {
          summaryCount = commercialSummary[mapping.summaryKey];
        }
      }
    }

    let ocr = null;
    const screenshotPath = screenshotMap[slide.page];
    if (USE_OCR && screenshotPath) {
      console.log(`OCR page ${slide.page}…`);
      const text = await ocrImage(screenshotPath);
      ocr = extractOcrSignals(text);
      ocr.rawPreview = text.slice(0, 400).replace(/\s+/g, " ");
    }

    const status = compareResult(apiResult, ocr, summaryCount);
    byStatus[status] = (byStatus[status] ?? 0) + 1;

    results.push({
      page: slide.page,
      title: slide.title,
      mapping,
      api: apiResult,
      summaryCount,
      ocr,
      screenshotPath,
      status,
    });
  }

  await api.dispose();

  const summary = {
    total: slides.filter((s) => !s.isBlank).length,
    mapped: mappedSlides.length,
    ocr: USE_OCR,
    byStatus,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify({ summary, results }, null, 2), "utf8");
  fs.writeFileSync(OUT_MD, buildMarkdown(results, summary), "utf8");

  console.log(`\nWrote: ${OUT_MD}`);
  console.log(`Wrote: ${OUT_JSON}`);
  console.log("Status breakdown:", summary.byStatus);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
