
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
    if (!response.ok) throw new Error("Registration failed. Email might already exist.");
    return response.json() as Promise<AuthenticationResponse>;
}

export async function loginUser(data: LoginPayload): Promise<AuthenticationResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Invalid email or password");
    return response.json() as Promise<AuthenticationResponse>;
}
