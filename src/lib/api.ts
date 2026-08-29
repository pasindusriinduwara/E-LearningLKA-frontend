const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

/**
 * Reusable wrapper around native fetch with error handling
 */
export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;

    // LocalStorage එකෙන් Token එක ගන්නවා (Browser එකේදී විතරයි)
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            // Token එකක් තියෙනවා නම් ඒක Authorization header එකට දානවා
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return response.json();
}
