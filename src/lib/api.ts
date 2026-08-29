const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1").replace(/\/+$/, "");

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(!isFormData ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options?.headers,
        },
    });

    if (!response.ok) {
        let message = `API error: ${response.status}`;
        try {
            const payload = await response.json() as { message?: string; error?: string };
            message = payload.message || payload.error || message;
        } catch {
        }
        throw new Error(message);
    }

    return response.json();
}
