const API_URL =
    import.meta.env.VITE_API_URL ?? "http://localhost:8080";

interface ApiRequestOptions extends RequestInit {
    authenticated?: boolean;
    retryOnUnauthorized?: boolean;
}

interface RefreshResponse {
    accessToken: string;
}

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
    readonly status: number;
    readonly fieldErrors: FieldErrors;

    constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}

// "monthlyRentCents" -> "Monthly rent cents"
function humanizeField(field: string): string {
    const words = field.replace(/([A-Z])/g, " $1").toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
}

// The backend sends { error: "..." } for most failures and { field: "message", ... } for validation failures.
function toApiError(status: number, body: unknown): ApiError {
    if (!body || typeof body !== "object") {
        return new ApiError("Request failed", status);
    }

    if (typeof (body as { error?: unknown }).error === "string") {
        return new ApiError((body as { error: string }).error, status);
    }

    const entries = Object.entries(body as Record<string, unknown>);

    if (
        entries.length > 0 &&
        entries.every(([, value]) => typeof value === "string")
    ) {
        const fieldErrors = Object.fromEntries(entries) as FieldErrors;
        // Pages that don't render field errors still get a readable message.
        const message = entries
            .map(([field, value]) => `${humanizeField(field)} ${value}`)
            .join(". ");
        return new ApiError(message, status, fieldErrors);
    }

    return new ApiError("Request failed", status);
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
        let body: unknown = null;

        try {
            body = await response.json();
        } catch {
            // Response did not contain JSON.
        }

        throw toApiError(response.status, body);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}