import React from "react";
import type { RegisterFormData } from "@/lib/types/auth";

interface TeacherDetailsStepProps {
    formData: RegisterFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleSubject: (subject: string) => void;
    onBack: () => void;
    onNext: () => void;
    loading?: boolean;
    error?: string;
}

export function TeacherDetailsStep({ formData, onChange, onToggleSubject, onBack, onNext, loading, error }: TeacherDetailsStepProps) {
    const subjectsList = [
        "Pure Mathematics", "Combined Mathematics", "Physics",
        "Chemistry", "Biology", "English", "Sinhala",
        "History", "Economics", "Accounting"
    ];

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-serif">Teaching profile</h2>
            <p className="text-gray-500 text-sm mb-8">Select the subjects you teach.</p>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">Subjects Taught</label>
                    <div className="flex flex-wrap gap-2.5">
                        {subjectsList.map((subject) => {
                            const isSelected = formData.subjects.includes(subject);
                            return (
                                <button
                                    key={subject}
                                    type="button"
                                    onClick={() => onToggleSubject(subject)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${isSelected ? "bg-[#4F46E5] text-white border-[#4F46E5]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                                >
                                    {subject}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">Qualification</label>
                    <input
                        type="text"
                        name="qualification"
                        value={formData.qualification}
                        onChange={onChange}
                        placeholder="B.Sc. Mathematics, University of Colombo"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all text-sm font-medium"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">Years of Experience</label>
                    <input
                        type="text"
                        name="experience"
                        value={formData.experience}
                        onChange={onChange}
                        placeholder="8 years"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all text-sm font-medium"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">Institute / Centre Name</label>
                    <input
                        type="text"
                        name="institute"
                        value={formData.institute}
                        onChange={onChange}
                        placeholder="Perera Tuition Centre"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all text-sm font-medium"
                    />
                </div>
            </div>

            <div className="flex gap-4 mt-8">
                <button
                    onClick={onBack}
                    disabled={loading}
                    className="w-1/3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <span>←</span> Back
                </button>
                <button
                    onClick={onNext}
                    disabled={formData.subjects.length === 0 || !formData.qualification || loading}
                    className="w-2/3 bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
                >
                    Continue <span>→</span>
                </button>
            </div>
        </div>
    );
}