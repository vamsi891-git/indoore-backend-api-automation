# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modules/USERS-PROFILE-IMAGE/tests/profileimage.spec.ts >> User Profile Image Flow >> Validate profile image upload, save, and delete lifecycle
- Location: src/modules/USERS-PROFILE-IMAGE/tests/profileimage.spec.ts:13:9

# Error details

```
TimeoutError: apiRequestContext.delete: Timeout 90000ms exceeded.
Call log:
  - → DELETE https://api.mdm.mppkvvcl.bestinfra.app/users/me/profile-image
    - user-agent: Playwright/1.60.0 (x64; ubuntu 24.04) node/20.20 CI/1
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic3VwZXIgYWRtaW4iLCJyaWQiOjEyLCJ0eXAiOiJhY2Nlc3MiLCJqdGkiOiI4OTQ2NmI2NC1iOTY0LTQ1NjItODNhMS1hY2ViY2Q4Yzc1MTUiLCJzaWQiOiIzM2I5Nzk3Ni0wMmJkLTQyNTMtODk1Mi01OWZmOGU2YzQ1ZmMiLCJpYXQiOjE3ODk0OTI4NzMsImV4cCI6MTc4OTUwMDA3MywiYXVkIjoibWRtcy1hY2Nlc3MiLCJpc3MiOiJtZG1zLWFwaSIsInN1YiI6IjNkOGVkMTFjLTdiZGYtNDY3Mi1iNjBmLWE1NjEyMzE5MmJlYSJ9.tkJtZkfXXu4Zff4V3bjaSKcLVwra67WX2u2ZHUU1YJU
    - x-csrf-token: 6b265746b33520cb4a91b29d37791b7ea469757cb62d5b7f0016787119745ec4.98abc77815b373884594f64f74d7a0c031febb4ba1d4728b772fe2725938d86c
    - Cookie: csrf_token=6b265746b33520cb4a91b29d37791b7ea469757cb62d5b7f0016787119745ec4.98abc77815b373884594f64f74d7a0c031febb4ba1d4728b772fe2725938d86c

```

# Test source

```ts
  10  |   "method" | "headers"
  11  | > & {
  12  |   headers?: Record<string, string>;
  13  | };
  14  | 
  15  | // 500 is an application error; retrying it doubles load and rarely helps.
  16  | const RETRYABLE_STATUSES = new Set([502, 503, 504]);
  17  | const RETRIES = 1;
  18  | const RETRY_DELAY_MS = 2000;
  19  | 
  20  | const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
  21  | 
  22  | function buildHeaders(
  23  |   token: string,
  24  |   incoming: Record<string, string> | undefined,
  25  |   csrfToken: string | undefined,
  26  |   method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  27  | ): Record<string, string> {
  28  |   const headers: Record<string, string> = {
  29  |     ...(incoming ?? {}),
  30  |     Authorization: `Bearer ${token}`,
  31  |     Accept: incoming?.Accept ?? "application/json"
  32  |   };
  33  | 
  34  |   if (MUTATING_METHODS.has(method) && csrfToken) {
  35  |     headers["x-csrf-token"] = csrfToken;
  36  |     headers.Cookie = incoming?.Cookie
  37  |       ? `${incoming.Cookie}; csrf_token=${csrfToken}`
  38  |       : `csrf_token=${csrfToken}`;
  39  |   }
  40  | 
  41  |   return headers;
  42  | }
  43  | 
  44  | function normalizeOptions(options: RequestOptions): RequestOptions {
  45  |   return {
  46  |     timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  47  |     ...options
  48  |   };
  49  | }
  50  | 
  51  | function isNonRetryableError(error: unknown): boolean {
  52  |   const message = error instanceof Error ? error.message : String(error);
  53  |   return (
  54  |     message.includes("Timeout") ||
  55  |     message.includes("timeout") ||
  56  |     message.includes("Request context disposed")
  57  |   );
  58  | }
  59  | 
  60  | function isTransientNetworkError(error: unknown): boolean {
  61  |   const message = error instanceof Error ? error.message : String(error);
  62  |   return (
  63  |     message.includes("ECONNABORTED") ||
  64  |     message.includes("ECONNRESET") ||
  65  |     message.includes("ETIMEDOUT") ||
  66  |     message.includes("EPIPE") ||
  67  |     message.includes("socket hang up")
  68  |   );
  69  | }
  70  | 
  71  | async function isCsrfMismatchResponse(response: APIResponse): Promise<boolean> {
  72  |   if (response.status() !== 403) {
  73  |     return false;
  74  |   }
  75  |   try {
  76  |     const body = (await response.json()) as {
  77  |       error?: { code?: string };
  78  |     };
  79  |     return body?.error?.code === "CSRF_MISMATCH";
  80  |   } catch {
  81  |     return false;
  82  |   }
  83  | }
  84  | 
  85  | async function executeWithToken(
  86  |   request: APIRequestContext,
  87  |   method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  88  |   url: string,
  89  |   options: RequestOptions,
  90  |   token: string
  91  | ): Promise<APIResponse> {
  92  |   const startTime = Date.now();
  93  |   const csrfToken = MUTATING_METHODS.has(method) ? await TokenManager.getCsrf() : undefined;
  94  |   const requestOptions = {
  95  |     ...normalizeOptions(options),
  96  |     headers: buildHeaders(token, options.headers, csrfToken, method)
  97  |   };
  98  | 
  99  |   const response = await (() => {
  100 |     switch (method) {
  101 |       case "GET":
  102 |         return request.get(url, requestOptions);
  103 |       case "POST":
  104 |         return request.post(url, requestOptions);
  105 |       case "PUT":
  106 |         return request.put(url, requestOptions);
  107 |       case "PATCH":
  108 |         return request.patch(url, requestOptions);
  109 |       case "DELETE":
> 110 |         return request.delete(url, requestOptions);
      |                              ^ TimeoutError: apiRequestContext.delete: Timeout 90000ms exceeded.
  111 |     }
  112 |   })();
  113 | 
  114 |   LoggerEngine.api({
  115 |     method,
  116 |     url,
  117 |     status: response.status(),
  118 |     responseTimeMs: Date.now() - startTime
  119 |   });
  120 | 
  121 |   return response;
  122 | }
  123 | 
  124 | async function requestWithAutoRefresh(
  125 |   request: APIRequestContext,
  126 |   method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  127 |   url: string,
  128 |   options: RequestOptions = {}
  129 | ): Promise<APIResponse> {
  130 |   const resolvedUrl = resolveApiPath(url);
  131 |   const normalizedOptions = normalizeOptions(options);
  132 | 
  133 |   const runRequest = async (token: string): Promise<APIResponse> =>
  134 |     RetryEngine.execute(
  135 |       async attempt => {
  136 |         const response = await executeWithToken(
  137 |           request,
  138 |           method,
  139 |           resolvedUrl,
  140 |           normalizedOptions,
  141 |           token
  142 |         );
  143 |         if (RETRYABLE_STATUSES.has(response.status())) {
  144 |           LoggerEngine.info(`${method} ${resolvedUrl} retry attempt ${attempt + 1} due to ${response.status()}`);
  145 |         }
  146 |         return response;
  147 |       },
  148 |       (response, error) => {
  149 |         if (error != null) {
  150 |           if (isNonRetryableError(error)) {
  151 |             return false;
  152 |           }
  153 |           return isTransientNetworkError(error);
  154 |         }
  155 |         return Boolean(response) && RETRYABLE_STATUSES.has((response as APIResponse).status());
  156 |       },
  157 |       { retries: RETRIES, delayMs: RETRY_DELAY_MS, label: `${method} ${resolvedUrl}` }
  158 |     );
  159 | 
  160 |   let token = await TokenManager.getToken();
  161 |   let response = await runRequest(token);
  162 | 
  163 |   if (response.status() === 401) {
  164 |     LoggerEngine.info(`${method} ${resolvedUrl} received 401; starting a new session`);
  165 |     token = await TokenManager.handleUnauthorized(token);
  166 |     response = await executeWithToken(request, method, resolvedUrl, normalizedOptions, token);
  167 |   }
  168 | 
  169 |   if (await isCsrfMismatchResponse(response)) {
  170 |     LoggerEngine.info(`${method} ${resolvedUrl} received CSRF_MISMATCH; refreshing session`);
  171 |     await TokenManager.forceSessionRefresh();
  172 |     token = await TokenManager.getToken();
  173 |     response = await executeWithToken(request, method, resolvedUrl, normalizedOptions, token);
  174 |   }
  175 | 
  176 |   return response;
  177 | }
  178 | 
  179 | export function getWithAutoRefresh(
  180 |   request: APIRequestContext,
  181 |   url: string,
  182 |   options: RequestOptions = {}
  183 | ): Promise<APIResponse> {
  184 |   return requestWithAutoRefresh(request, "GET", url, options);
  185 | }
  186 | 
  187 | export function postWithAutoRefresh(
  188 |   request: APIRequestContext,
  189 |   url: string,
  190 |   options: RequestOptions = {}
  191 | ): Promise<APIResponse> {
  192 |   return requestWithAutoRefresh(request, "POST", url, options);
  193 | }
  194 | 
  195 | export function putWithAutoRefresh(
  196 |   request: APIRequestContext,
  197 |   url: string,
  198 |   options: RequestOptions = {}
  199 | ): Promise<APIResponse> {
  200 |   return requestWithAutoRefresh(request, "PUT", url, options);
  201 | }
  202 | 
  203 | export function patchWithAutoRefresh(
  204 |   request: APIRequestContext,
  205 |   url: string,
  206 |   options: RequestOptions = {}
  207 | ): Promise<APIResponse> {
  208 |   return requestWithAutoRefresh(request, "PATCH", url, options);
  209 | }
  210 | 
```