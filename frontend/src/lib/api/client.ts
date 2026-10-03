const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

interface RequestOptions extends RequestInit {
    authenticated?: boolean;
}

export async function apiRequest<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const {
        authenticated = false,
        headers,
        ...fetchOptions
    } = options;

    const requestHeaders = new Headers(headers);

    requestHeaders.set("Content-Type", "application/json");

    if (authenticated) {
        const token = localStorage.getItem("accessToken");

        if (token) {
            requestHeaders.set(
                "Authorization",
                `Bearer ${token}`,
            );
        }
    }

    const response = await fetch(
        `${API_URL}${path}`,
        {
            ...fetchOptions,
            headers: requestHeaders,
        },
    );

    if (!response.ok) {
        let message = "Request failed";
        try {
            const body = await response.json();

            if (body?.error) {
                message = body.error;
            }
        } catch {
            // Response wasn't JSON.
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }
    return response.json() as Promise<T>;
}