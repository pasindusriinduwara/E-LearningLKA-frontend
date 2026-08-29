"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Check } from "lucide-react";

import { PersonalDetailsStep } from "@/components/auth/PersonalDetailsStep";
import { AcademicDetailsStep } from "@/components/auth/AcademicDetailsStep";
import { TeacherDetailsStep } from "@/components/auth/TeacherDetailsStep";
import { AccountDetailsStep } from "@/components/auth/AccountDetailsStep";
import type { RegisterFormData } from "@/lib/types/auth";
import { registerUser } from "@/services/authService";

export default function MultiStepRegister() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<RegisterFormData>({
        role: "",
        firstName: "", lastName: "", dob: "", phone: "", nic: "",
        grade: "", stream: "", medium: "",
        subjects: [], qualification: "", experience: "",
        institute: "", email: "", password: "", confirmPassword: ""
    });

    const handleFinalSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const payload = {
                email: formData.email,
                password: formData.password,
                phoneNumber: formData.phone,
                userType: formData.role.toUpperCase(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                dob: formData.dob,
                nic: formData.nic,
                grade: formData.grade,
                stream: formData.stream,
                medium: formData.medium,
                subjects: formData.subjects,
                qualification: formData.qualification,
                experience: formData.experience,
                institute: formData.institute
            };
            const res = await registerUser(payload);
            localStorage.setItem("token", res.token);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleSelect = (selectedRole: "student" | "teacher") => {
        setFormData({ ...formData, role: selectedRole });
    };

    const handleNext = () => setStep((prev) => prev + 1);
    const handleBack = () => setStep((prev) => prev - 1);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSelectChange = (name: string, value: string) => setFormData({ ...formData, [name]: value });

    const handleToggleSubject = (subject: string) => {
        const currentSubjects = formData.subjects;
        if (currentSubjects.includes(subject)) {
            setFormData({ ...formData, subjects: currentSubjects.filter(s => s !== subject) });
        } else {
            setFormData({ ...formData, subjects: [...currentSubjects, subject] });
        }
    };

    const step3Label = formData.role === "teacher" ? "Subjects" : "Academic";
    const stepName = step === 1 ? "Role" : step === 2 ? "Personal" : step === 3 ? step3Label : "Account";
    const progress = step === 1 ? "0%" : step === 2 ? "33%" : step === 3 ? "66%" : "100%";

    const stepsList = [
        { num: 1, label: "Role" },
        { num: 2, label: "Personal" },
        { num: 3, label: step3Label },
        { num: 4, label: "Account" },
    ];

    return (
        <div className="flex min-h-screen font-sans">
            <div
                className="hidden lg:flex flex-col w-[35%] bg-[#0B132B] text-white p-12 relative overflow-hidden"
                style={{
                    backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            >
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex-grow">
                    <div className="flex items-center gap-2 mb-16">
                        <div className="bg-[#4F46E5] p-2 rounded-lg">
                            <GraduationCap size={24} className="text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">classroom.</span>
                    </div>

                    <h1 className="text-5xl font-extrabold mb-4 leading-tight font-serif">
                        Join the <br /> platform.
                    </h1>
                    <p className="text-gray-400 text-sm mb-12 max-w-xs">
                        Register as a student or teacher and get started in minutes.
                    </p>

                    <div>
                        <p className="text-xs font-bold text-gray-500 tracking-widest mb-6 uppercase">Registration Steps</p>
                        <div className="space-y-6">
                            {stepsList.map((s) => {
                                const isCompleted = step > s.num;
                                const isActive = step === s.num;

                                return (
                                    <div key={s.num} className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isCompleted ? "bg-emerald-500 text-white" :
                                                isActive ? "bg-[#4F46E5] text-white" : "bg-[#1E293B] text-gray-500"
                                            }`}>
                                            {isCompleted ? <Check size={16} strokeWidth={3} /> : s.num}
                                        </div>
                                        <span className={`text-sm font-medium transition-colors ${isActive || isCompleted ? "text-white" : "text-gray-500"
                                            }`}>
                                            {s.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-xs text-gray-600">
                    © 2026 classroom.
                </div>
            </div>

            <div className="flex-1 bg-[#FAFAFA] flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-md">

                    <div className="flex justify-between items-center mb-2 text-xs font-bold text-gray-400 tracking-widest uppercase">
                        <span>Step {step} of 4 — {stepName}</span>
                        <span className="text-[#4F46E5]">{progress}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1 rounded-full mb-12">
                        <div className="bg-[#4F46E5] h-1 rounded-full transition-all duration-500" style={{ width: progress }}></div>
                    </div>

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-serif">Who are you?</h2>
                            <p className="text-gray-500 text-sm mb-8">Select your role to get started.</p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button
                                    onClick={() => handleRoleSelect("student")}
                                    className={`flex flex-col items-center justify-center p-6 bg-white rounded-xl border-2 transition-all ${formData.role === "student" ? "border-[#4F46E5] bg-[#EEF2FF]" : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <span className="text-4xl mb-4 drop-shadow-md">🎓</span>
                                    <span className={`font-bold mb-1 ${formData.role === "student" ? "text-[#4338CA]" : "text-gray-900"}`}>Student</span>
                                    <span className="text-xs text-gray-500 text-center">View classes, materials & results</span>
                                </button>

                                <button
                                    onClick={() => handleRoleSelect("teacher")}
                                    className={`flex flex-col items-center justify-center p-6 bg-white rounded-xl border-2 transition-all ${formData.role === "teacher" ? "border-[#4F46E5] bg-[#EEF2FF]" : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <span className="text-4xl mb-4 drop-shadow-md">🧑‍🏫</span>
                                    <span className={`font-bold mb-1 ${formData.role === "teacher" ? "text-[#4338CA]" : "text-gray-900"}`}>Teacher</span>
                                    <span className="text-xs text-gray-500 text-center">Manage classes, students & content</span>
                                </button>
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={!formData.role}
                                className="w-full bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                Continue <span>→</span>
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <PersonalDetailsStep
                            formData={formData}
                            onChange={handleChange}
                            onBack={handleBack}
                            onNext={handleNext}
                        />
                    )}

                    {step === 3 && formData.role === "student" && (
                        <AcademicDetailsStep
                            formData={formData}
                            onChange={handleChange}
                            onSelect={handleSelectChange}
                            onBack={handleBack}
                            onNext={handleNext}
                        />
                    )}

                    {step === 3 && formData.role === "teacher" && (
                        <TeacherDetailsStep
                            formData={formData}
                            onChange={handleChange}
                            onToggleSubject={handleToggleSubject}
                            onBack={handleBack}
                            onNext={handleNext}
                        />
                    )}

                    {step === 4 && (
                        <AccountDetailsStep
                            formData={formData}
                            onChange={handleChange}
                            onBack={handleBack}
                            onSubmit={handleFinalSubmit}
                            loading={loading}
                            error={error}
                        />
                    )}

                    <p className="text-center mt-8 text-sm text-gray-500">
                        Already have an account? <Link href="/login" className="text-[#4F46E5] font-semibold hover:underline">Sign in</Link>
                    </p>

                </div>
            </div>
        </div>
    );
}