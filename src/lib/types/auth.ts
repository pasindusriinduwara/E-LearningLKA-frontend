export interface RegisterFormData {
    role: "student" | "teacher" | "";
    firstName: string;
    lastName: string;
    dob: string;
    phone: string;
    nic: string;
    grade: string;
    stream: string;
    medium: string;
    subjects: string[];
    qualification: string;
    experience: string;
    institute: string;
    email: string;
    password: string;
    confirmPassword: string;
}