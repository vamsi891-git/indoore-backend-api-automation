/**
 * Rewrite PerformanceTracker.track URL args in specs/harnesses to use rawResponse.url().
 * Also remove unused local endpoint/url consts that only fed the tracker.
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "src", "modules");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(spec|harness)\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

function replaceTrackCalls(source) {
  // PerformanceTracker.track(\n  EXPR,\n  NAME,\n  URL,\n  TIME\n)
  // or single-line variants
  const trackRe =
    /PerformanceTracker\.track\(\s*([\s\S]*?)\s*\)/g;

  return source.replace(trackRe, (full, argsInner) => {
    // Split top-level commas (not inside backticks/parens/braces)
    const args = splitArgs(argsInner);
    if (args.length < 3) return full;

    const responseExpr = args[0].trim();
    const nameExpr = args[1].trim();
    const urlExpr = args[2].trim();
    const timeExpr = args[3]?.trim();

    // Already using .url()
    if (/\.url\(\)\s*$/.test(urlExpr.replace(/,$/, ""))) {
      return full;
    }

    // Only rewrite if URL looks like a path construction / BASE_URL / endpoint / url var / Data path
    const looksLikePath =
      /BASE_URL|\/indore\/|endpoint|buildCommands|Paths?\.|paths\.|PATH|`[^`]*\$\{/.test(
        urlExpr,
      ) ||
      /^(url|endpoint|apiUrl|postUrl|queryUrl|requestUrl)$/.test(urlExpr);

    if (!looksLikePath && args.length === 4) {
      // Might already be clean (e.g. some other expression) — still rewrite common response.url pattern
      if (!responseExpr.includes("rawResponse") && !responseExpr.includes("Response")) {
        return full;
      }
    }

    const urlReplacement = `${responseExpr}.url()`;
    const newArgs = timeExpr
      ? [responseExpr, nameExpr, urlReplacement, timeExpr]
      : [responseExpr, nameExpr, urlReplacement];

    return `PerformanceTracker.track(\n${newArgs.map((a, i) => `        ${a}${i < newArgs.length - 1 ? "," : ""}`).join("\n")}\n      )`;
  });
}

function splitArgs(s) {
  const args = [];
  let cur = "";
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;
  let inBacktick = false;
  let inSingle = false;
  let inDouble = false;
  let escape = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      cur += ch;
      escape = false;
      continue;
    }
    if (ch === "\\" && (inBacktick || inSingle || inDouble)) {
      cur += ch;
      escape = true;
      continue;
    }
    if (inBacktick) {
      if (ch === "`") inBacktick = false;
      cur += ch;
      continue;
    }
    if (inSingle) {
      if (ch === "'") inSingle = false;
      cur += ch;
      continue;
    }
    if (inDouble) {
      if (ch === '"') inDouble = false;
      cur += ch;
      continue;
    }
    if (ch === "`") {
      inBacktick = true;
      cur += ch;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      cur += ch;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      cur += ch;
      continue;
    }
    if (ch === "(") depthParen++;
    if (ch === ")") depthParen--;
    if (ch === "{") depthBrace++;
    if (ch === "}") depthBrace--;
    if (ch === "[") depthBracket++;
    if (ch === "]") depthBracket--;
    if (
      ch === "," &&
      depthParen === 0 &&
      depthBrace === 0 &&
      depthBracket === 0
    ) {
      args.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

function removeUnusedEndpointConsts(source) {
  let result = source;
  const declRe =
    /^[ \t]*const (endpoint|url|apiUrl|postUrl|queryUrl|requestUrl) = [\s\S]*?;\r?\n/gm;
  const decls = [...source.matchAll(declRe)];
  // Remove from end so indices stay valid conceptually — rebuild by filtering
  for (const match of decls.reverse()) {
    const name = match[1];
    const without = result.replace(match[0], "");
    const refs = without.match(new RegExp(`\\b${name}\\b`, "g"));
    if (!refs || refs.length === 0) {
      result = without;
    }
  }
  return result;
}

let changedFiles = 0;
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, "utf8");
  let after = replaceTrackCalls(before);
  after = removeUnusedEndpointConsts(after);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changedFiles++;
    console.log("updated", path.relative(process.cwd(), file));
  }
}
console.log(`Done. Updated ${changedFiles} files.`);
