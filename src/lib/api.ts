export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1").replace(/\/+$/, "");

export function getLocalAssessmentFileUrl(href: string): URL | null {
    const base = new URL(API_BASE_URL);
    const url = new URL(href, base);
    return url.origin === base.origin && url.pathname.startsWith("/api/v1/assessments/files/")
        ? url : null;
}

export async function downloadAssessmentFile(url: URL): Promise<void> {
    if (!getLocalAssessmentFileUrl(url.href)) throw new Error("Invalid assessment file URL");
    const token = localStorage.getItem("token");
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error(`Could not download attachment (${response.status})`);
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = decodeURIComponent(url.pathname.split("/").pop() || "attachment");
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

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

    if (response.status === 204) {
        return undefined as T;
    }

    const text = await response.text();
    if (!text) {
        return undefined as T;
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        return text as unknown as T;
    }
}

