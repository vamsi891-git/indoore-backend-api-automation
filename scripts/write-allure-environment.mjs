import fs from "fs";
import path from "path";

const outputDir = path.join(process.cwd(), "allure-results");
const lines = [
  `BASE_URL=${process.env.BASE_URL ?? "not-set"}`,
  `Node=${process.version}`,
  `Platform=${process.platform}`,
  `CI=${process.env.CI ?? "false"}`,
  `GITHUB_REF=${process.env.GITHUB_REF ?? "local"}`,
  `GITHUB_SHA=${process.env.GITHUB_SHA ?? "local"}`,
];

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "environment.properties"),
  `${lines.join("\n")}\n`,
  "utf8",
);
