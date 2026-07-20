/**
 * Report env vars referenced in code but missing from .env.example.
 * Usage: node scripts/check-env-example.mjs
 */
import fs from "fs";
import { execSync } from "child_process";

const env = fs.readFileSync(".env.example", "utf8");
const out = execSync('git grep -hoE "process\\.env\\.[A-Z0-9_]+" -- src scripts', {
  encoding: "utf8",
});

const used = [
  ...new Set(
    out
      .split(/\r?\n/)
      .map((line) => line.replace("process.env.", "").trim())
      .filter(Boolean),
  ),
];

const missing = used
  .filter((name) => !new RegExp(`(^|[^A-Z0-9_])${name}([^A-Z0-9_]|$)`, "m").test(env))
  .sort();

console.log(`Referenced: ${used.length}, missing from .env.example: ${missing.length}`);
console.log(missing.join("\n"));
