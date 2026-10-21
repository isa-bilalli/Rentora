import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    ApiError,
    apiRequest,
    clearAccessToken,
    getAccessToken,
    refreshAccessToken,
    setAccessToken,
} from "./client";

function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

// Answers each fetch with the next response in order and records what was asked.
function fakeFetch(...responses: (Response | Error)[]) {
    const fetchMock = vi.fn<typeof fetch>();
    for (const response of responses) {
        if (response instanceof Error) {
            fetchMock.mockRejectedValueOnce(response);
        } else {
            fetchMock.mockResolvedValueOnce(response);
        }
    }
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

function requestOf(fetchMock: ReturnType<typeof fakeFetch>, index: number) {
    const [url, init] = fetchMock.mock.calls[index];
    return {
        url: String(url),
        method: init?.method ?? "GET",
        credentials: init?.credentials,
        authorization: new Headers(init?.headers).get("Authorization"),
    };
}

// The token lives in the module, so every test starts without one.
beforeEach(() => {
    clearAccessToken();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("refreshAccessToken", () => {
    it("keeps the new access token when the refresh cookie is accepted", async () => {
        const fetchMock = fakeFetch(jsonResponse(200, { accessToken: "fresh" }));

        await expect(refreshAccessToken()).resolves.toBe("fresh");

        expect(getAccessToken()).toBe("fresh");
        const refresh = requestOf(fetchMock, 0);
        expect(refresh.url).toMatch(/\/api\/auth\/refresh$/);
        expect(refresh.method).toBe("POST");
        // The refresh token is an httpOnly cookie, so it only travels with credentials included.
        expect(refresh.credentials).toBe("include");
    });

    it("forgets the token when the refresh is refused", async () => {
        setAccessToken("old");
        fakeFetch(jsonResponse(401, { error: "Refresh token is missing" }));

        await expect(refreshAccessToken()).resolves.toBeNull();

        expect(getAccessToken()).toBeNull();
    });

    it("forgets the token when the server can't be reached", async () => {
        setAccessToken("old");
        fakeFetch(new TypeError("Failed to fetch"));

        await expect(refreshAccessToken()).resolves.toBeNull();

        expect(getAccessToken()).toBeNull();
    });

    // Refresh tokens rotate: two refreshes at once would spend the same cookie twice.
    it("shares one refresh between callers that ask at the same time", async () => {
        const fetchMock = fakeFetch(
            jsonResponse(200, { accessToken: "fresh" }),
            jsonResponse(200, { accessToken: "later" }),
        );

        const [first, second] = await Promise.all([refreshAccessToken(), refreshAccessToken()]);

        expect([first, second]).toEqual(["fresh", "fresh"]);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        // Once it has finished, the next refresh is a new request.
        await expect(refreshAccessToken()).resolves.toBe("later");
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});

describe("apiRequest when the access token has expired", () => {
    it("refreshes once and retries the request with the new token", async () => {
        setAccessToken("expired");
        const fetchMock = fakeFetch(
            jsonResponse(401, { error: "Unauthorized" }),
            jsonResponse(200, { accessToken: "fresh" }),
            jsonResponse(200, [{ id: 1 }]),
        );

        await expect(apiRequest("/api/organizations/2/tenants", { authenticated: true })).resolves.toEqual([{ id: 1 }]);

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(requestOf(fetchMock, 0).authorization).toBe("Bearer expired");
        expect(requestOf(fetchMock, 1).url).toMatch(/\/api\/auth\/refresh$/);
        expect(requestOf(fetchMock, 2).authorization).toBe("Bearer fresh");
    });

    it("retries only once", async () => {
        setAccessToken("expired");
        const fetchMock = fakeFetch(
            jsonResponse(401, { error: "Unauthorized" }),
            jsonResponse(200, { accessToken: "fresh" }),
            jsonResponse(401, { error: "Still unauthorized" }),
        );

        const request = apiRequest("/api/organizations/2/tenants", { authenticated: true });

        await expect(request).rejects.toMatchObject({ status: 401, message: "Still unauthorized" });
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("reports the original error when the refresh is refused too", async () => {
        setAccessToken("expired");
        const fetchMock = fakeFetch(
            jsonResponse(401, { error: "Unauthorized" }),
            jsonResponse(401, { error: "Refresh token is missing" }),
        );

        const request = apiRequest("/api/organizations/2/tenants", { authenticated: true });

        await expect(request).rejects.toBeInstanceOf(ApiError);
        await expect(request).rejects.toMatchObject({ status: 401, message: "Unauthorized" });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(getAccessToken()).toBeNull();
    });

    // A wrong password at login is a 401 too, and must not set off a refresh.
    it("does not refresh for a request that sends no token", async () => {
        const fetchMock = fakeFetch(jsonResponse(401, { error: "Invalid email or password" }));

        const request = apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email: "owner@example.com", password: "wrong" }),
        });

        await expect(request).rejects.toMatchObject({ status: 401, message: "Invalid email or password" });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
