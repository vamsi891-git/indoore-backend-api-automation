const DEFAULT_SWAGGER_PATH = "/indore/api-docs/";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * Resolve OpenAPI / Swagger UI URL from BASE_URL (or SWAGGER_URL override).
 */
export function resolveSwaggerUrl(): string {
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
