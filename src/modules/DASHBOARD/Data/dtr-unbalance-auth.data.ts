/**
 * Shared auth-negative probes for DTR load/voltage unbalance GET endpoints.
 * Uses raw unauthenticated context — TimedApiClient injects Bearer via TokenManager.
 */

export const dtrUnbalanceUnauthorizedCode = "UNAUTHORIZED";
export const dtrUnbalanceUnauthorizedMessage =
    "Missing or invalid Authorization header";

export const dtrUnbalanceAccessTokenInvalidCode = "ACCESS_TOKEN_INVALID";
export const dtrUnbalanceAccessTokenInvalidMessage =
    "Invalid or expired access token";

/** Minimal expired-looking JWT (exp=1) — signature is irrelevant; API rejects as invalid. */
export const dtrUnbalanceExpiredLookingJwt =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxfQ.sig";

export interface DtrUnbalanceAuthNegativeCase {
    testName: string;
    headers: Record<string, string>;
    expectedStatus: 401;
    expectedErrorCode: string;
    expectedMessage: string;
    tags: string[];
}

export const dtrUnbalanceAuthNegativeCases: DtrUnbalanceAuthNegativeCase[] = [
    {
        testName: "cannot open without logging in",
        headers: {},
        expectedStatus: 401,
        expectedErrorCode: dtrUnbalanceUnauthorizedCode,
        expectedMessage: dtrUnbalanceUnauthorizedMessage,
        tags: ["@negative", "@dashboard", "@auth"],
    },
    {
        testName: "cannot open with an empty login token",
        headers: { Authorization: "Bearer " },
        expectedStatus: 401,
        expectedErrorCode: dtrUnbalanceUnauthorizedCode,
        expectedMessage: dtrUnbalanceUnauthorizedMessage,
        tags: ["@negative", "@dashboard", "@auth", "@edge"],
    },
    {
        testName: "cannot open with a badly formed login token",
        headers: { Authorization: "Token abc" },
        expectedStatus: 401,
        expectedErrorCode: dtrUnbalanceUnauthorizedCode,
        expectedMessage: dtrUnbalanceUnauthorizedMessage,
        tags: ["@negative", "@dashboard", "@auth", "@edge"],
    },
    {
        testName: "cannot open with an invalid login token",
        headers: { Authorization: "Bearer not.a.jwt" },
        expectedStatus: 401,
        expectedErrorCode: dtrUnbalanceAccessTokenInvalidCode,
        expectedMessage: dtrUnbalanceAccessTokenInvalidMessage,
        tags: ["@negative", "@dashboard", "@auth", "@edge"],
    },
    {
        testName: "cannot open with an expired login token",
        headers: {
            Authorization: `Bearer ${dtrUnbalanceExpiredLookingJwt}`,
        },
        expectedStatus: 401,
        expectedErrorCode: dtrUnbalanceAccessTokenInvalidCode,
        expectedMessage: dtrUnbalanceAccessTokenInvalidMessage,
        tags: ["@negative", "@dashboard", "@auth", "@edge"],
    },
];
