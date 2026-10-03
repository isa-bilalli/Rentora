const API_URL =
    import.meta.env.VITE_API_URL ?? "http://localhost:8080";

interface ApiRequestOptions extends RequestInit {
    authenticated?: boolean;
    retryOnUnauthorized?: boolean;
}

interface RefreshResponse {
    accessToken: string;
}

let accessToken: string | null = null;

let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string): void {
    accessToken = token;
}

export function getAccessToken(): string | null {
    return accessToken;
}

export function clearAccessToken(): void {
    accessToken = null;
}

export async function refreshAccessToken(): Promise<string | null> {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/auth/refresh`,
                {
                    method: "POST",
                    credentials: "include",
                },
            );

            if (!response.ok) {
                clearAccessToken();
                return null;
            }

            const data =
                (await response.json()) as RefreshResponse;

            setAccessToken(data.accessToken);

            return data.accessToken;
        } catch {
            clearAccessToken();
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

export async function apiRequest<T>(
    path: string,
    options: ApiRequestOptions = {},
): Promise<T> {
    const {
        authenticated = false,
        retryOnUnauthorized = true,
        headers,
        ...fetchOptions
    } = options;

    const requestHeaders = new Headers(headers);

    if (fetchOptions.body && !requestHeaders.has("Content-Type")) {
        requestHeaders.set(
            "Content-Type",
            "application/json",
        );
    }

    if (authenticated && accessToken) {
        requestHeaders.set(
            "Authorization",
            `Bearer ${accessToken}`,
        );
    }

    const response = await fetch(
        `${API_URL}${path}`,
        {
            ...fetchOptions,
            credentials: "include",
            headers: requestHeaders,
        },
    );

    if (
        response.status === 401 &&
        authenticated &&
        retryOnUnauthorized &&
        path !== "/api/auth/refresh"
    ) {
        const newAccessToken =
            await refreshAccessToken();

        if (newAccessToken) {
            return apiRequest<T>(
                path,
                {
                    ...options,
                    retryOnUnauthorized: false,
                },
            );
        }
    }

    if (!response.ok) {
        let message = "Request failed";

        try {
            const body = await response.json();

            if (
                body &&
                typeof body.error === "string"
            ) {
                message = body.error;
            }
        } catch {
            // Response did not contain JSON.
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}