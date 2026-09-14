
const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_BASE_URL = configuredBaseUrl.replace(/\/api\/v1\/?$/, "");

export interface RegisterPayload {
    email: string;
    password: string;
    phoneNumber?: string;
    userType: "STUDENT" | "TEACHER";
    firstName?: string;
    lastName?: string;
    dob?: string;
    nic?: string;
    grade?: string;
    stream?: string;
    medium?: string;
    subjects?: string[];
    qualification?: string;
    experience?: string;
    institute?: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthenticationResponse {
    token: string;
    role?: "STUDENT" | "TEACHER" | string;
    email?: string;
    name?: string;
}

export async function registerUser(data: RegisterPayload): Promise<AuthenticationResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        let errorMessage = "Registration failed. Please check your details and try again.";
        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData.error) {
                errorMessage = errorData.error;
            } else if (errorData.errors && typeof errorData.errors === "object") {
                const firstError = Object.values(errorData.errors)[0];
                if (typeof firstError === "string") {
                    errorMessage = firstError;
                }
            }
        } catch {
            if (response.status === 409) {
                errorMessage = "An account with this email address already exists. Please sign in instead.";
            } else if (response.status === 400) {
                errorMessage = "Invalid registration details. Please verify all fields.";
            }
        }
        throw new Error(errorMessage);
    }

    return response.json() as Promise<AuthenticationResponse>;
}

export async function loginUser(data: LoginPayload): Promise<AuthenticationResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        let errorMessage = "Invalid email or password. Please try again.";
        try {
            const errorData = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            // fallback
        }
        throw new Error(errorMessage);
    }

    return response.json() as Promise<AuthenticationResponse>;
}
