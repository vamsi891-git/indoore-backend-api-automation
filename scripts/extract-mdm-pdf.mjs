/**
 * Extract plain text from the MDM presentation PDF for offline slide mapping.
 *
 * When to run: before `compare-mdm-screenshots-with-apis.mjs` if
 * `reports/mdm-pdf-extract.txt` is missing or the PDF was updated.
 *   node scripts/extract-mdm-pdf.mjs
 *
 * Output: `reports/mdm-pdf-extract.txt` (+ console preview).
 * Input PDF: `templates/MDM Presentation_23.12.2025.pdf`
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.join(__dirname, "..", "templates", "MDM Presentation_23.12.2025.pdf");
const outPath = path.join(__dirname, "..", "reports", "mdm-pdf-extract.txt");

const buf = fs.readFileSync(pdfPath);
const parser = new PDFParse({ data: buf });
const result = await parser.getText();
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, result.text);
console.log("Pages:", result.total);
console.log("Chars:", result.text.length);
console.log("--- PREVIEW ---");
console.log(result.text.slice(0, 15000));
