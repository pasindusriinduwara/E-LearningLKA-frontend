import React from "react";
import type { RegisterFormData } from "@/lib/types/auth";

interface AcademicDetailsStepProps {
    formData: RegisterFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelect: (name: string, value: string) => void;
    onBack: () => void;
    onNext?: () => void;
    onSubmit?: () => void;
    loading?: boolean;
    error?: string;
}

export function AcademicDetailsStep({ formData, onChange, onSelect, onNext, onBack, onSubmit, loading, error }: AcademicDetailsStepProps) {

    const grades = ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10 (O/L)", "Grade 11 (O/L)", "Grade 12 (A/L)", "Grade 13 (A/L)"];
    const streams = ["Physical Science", "Biological Science", "Commerce", "Arts", "Technology"];
    const mediums = ["Sinhala", "Tamil", "English"];

    const getPillStyle = (isSelected: boolean) =>
        `px-4 py-2 text-sm font-medium rounded-lg border transition-all ${isSelected
            ? "bg-[#4F46E5] text-white border-[#4F46E5]"
            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`;

    const handleAction = () => {
        if (onSubmit) {
            onSubmit();
        } else if (onNext) {
            onNext();
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-serif">Academic info</h2>
            <p className="text-gray-500 text-sm mb-8">Your current grade and stream.</p>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            <div className="space-y-6">

                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">Grade</label>
                    <div className="flex flex-wrap gap-2.5">
                        {grades.map((grade) => (
                            <button
                                key={grade}
                                type="button"
                                onClick={() => onSelect("grade", grade)}
                                className={getPillStyle(formData.grade === grade)}
                            >
                                {grade}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">Stream</label>
                    <div className="flex flex-wrap gap-2.5">
                        {streams.map((stream) => (
                            <button
                                key={stream}
                                type="button"
                                onClick={() => onSelect("stream", stream)}
                                className={getPillStyle(formData.stream === stream)}
                            >
                                {stream}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">Teaching Medium</label>
                    <div className="flex gap-2.5">
                        {mediums.map((medium) => (
                            <button
                                key={medium}
                                type="button"
                                onClick={() => onSelect("medium", medium)}
                                className={getPillStyle(formData.medium === medium)}
                            >
                                {medium}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">Institute / School Name</label>
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
                    onClick={handleAction}
                    disabled={!formData.grade || !formData.medium || loading} 
                    className="w-2/3 bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]"
                >
                    {loading ? "Creating..." : onSubmit ? "Create account" : "Continue →"}
                </button>
            </div>
        </div>
    );
}