import React from "react";
import type { RegisterFormData } from "@/lib/types/auth";

interface PersonalDetailsStepProps {
    formData: RegisterFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function PersonalDetailsStep({ formData, onChange, onNext, onBack }: PersonalDetailsStepProps) {
    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-serif">Personal details</h2>
            <p className="text-gray-500 text-sm mb-8">Tell us about yourself.</p>

            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={onChange}
                            placeholder="Sahan"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={onChange}
                            placeholder="Amarasinghe"
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">Date of Birth</label>
                    <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={onChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium text-gray-600"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">Phone Number</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={onChange}
                        placeholder="+94 77 000 0000"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">NIC / School ID</label>
                    <input
                        type="text"
                        name="nic"
                        value={formData.nic}
                        onChange={onChange}
                        placeholder="200012345678"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium"
                    />
                </div>
            </div>

            <div className="flex gap-4 mt-8">
                <button
                    onClick={onBack}
                    className="w-1/3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <span>←</span> Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!formData.firstName || !formData.lastName}
                    className="w-2/3 bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    Continue <span>→</span>
                </button>
            </div>
        </div>
    );
}