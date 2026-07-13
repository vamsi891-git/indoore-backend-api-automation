import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "src/modules");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(f));
    else if (/\.(spec|harness)\.ts$/.test(e.name)) out.push(f);
  }
  return out;
}

let n = 0;
for (const file of walk(ROOT)) {
  let s = fs.readFileSync(file, "utf8");
  const before = s;

  // defectContext / similar: endpoint: "/indore/..."
  s = s.replace(
    /endpoint:\s*(["'`])\/indore\/[^"'`]+?\1/g,
    "endpoint: rawResponse.url()",
  );

  // leftover PerformanceTracker with BASE_URL + /indore
  s = s.replace(
    /PerformanceTracker\.track\(\s*([^,\n]+),\s*([^,\n]+),\s*`\$\{process\.env\.BASE_URL\}\/indore\/[^`]+`,\s*([^)]+)\)/g,
    (_m, resp, name, time) =>
      `PerformanceTracker.track(\n          ${resp.trim()},\n          ${name.trim()},\n          ${resp.trim()}.url(),\n          ${time.trim()}\n        )`,
  );

  // Also: third arg already a full template with BASE_URL on its own line (invite-list style)
  s = s.replace(
    /(PerformanceTracker\.track\(\s*\n\s*)([^\n,]+),(\s*\n\s*)([^\n,]+),(\s*\n\s*)`\$\{process\.env\.BASE_URL\}\/indore\/[^`]+`,(\s*\n\s*)([^\n)]+)(\s*\n\s*\))/g,
    (_m, a, resp, b, name, c, d, time, e) =>
      `${a}${resp},${b}${name},${c}${resp.trim()}.url(),${d}${time}${e}`,
  );

  if (s !== before) {
    fs.writeFileSync(file, s);
    n++;
    console.log("updated", path.relative(process.cwd(), file));
  }
}
console.log("done", n);
