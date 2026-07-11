#!/usr/bin/env node
/**
 * Print (and optionally open) Swagger UI URL derived from BASE_URL / SWAGGER_URL.
 *
 * Usage:
 *   node scripts/open-swagger.mjs
 *   node scripts/open-swagger.mjs --open
 */
import dotenv from "dotenv";
import { execSync } from "node:child_process";

dotenv.config();

const DEFAULT_SWAGGER_PATH = "/indore/api-docs/";

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function resolveSwaggerUrl() {
  const explicit = process.env.SWAGGER_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const baseUrl = process.env.BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error(
      "Missing BASE_URL — set BASE_URL or SWAGGER_URL to open Swagger UI",
    );
  }

  const swaggerPath =
    process.env.SWAGGER_PATH?.trim() || DEFAULT_SWAGGER_PATH;
  const normalizedPath = swaggerPath.startsWith("/")
    ? swaggerPath
    : `/${swaggerPath}`;

  return `${trimTrailingSlash(baseUrl)}${normalizedPath}`;
}

const shouldOpen = process.argv.includes("--open");
const url = resolveSwaggerUrl();

console.log(`Swagger UI: ${url}`);

if (shouldOpen) {
  const platform = process.platform;
  if (platform === "win32") {
    execSync(`start "" "${url}"`, { stdio: "ignore", shell: true });
  } else if (platform === "darwin") {
    execSync(`open "${url}"`, { stdio: "ignore" });
  } else {
    execSync(`xdg-open "${url}"`, { stdio: "ignore" });
  }
}
