import React from "react";
import type { RegisterFormData } from "@/lib/types/auth";

interface AccountDetailsStepProps {
  formData: RegisterFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  loading?: boolean;
  error?: string;
}

export function AccountDetailsStep({ formData, onChange, onBack, onNext, onSubmit, loading, error }: AccountDetailsStepProps) {

  const isPasswordValid = formData.password.length >= 8;
  const isPasswordMatch = formData.password === formData.confirmPassword;
  const canContinue = formData.email && isPasswordValid && isPasswordMatch && !loading;

  const handleAction = () => {
    if (onNext) {
      onNext();
    } else if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-serif">Create account</h2>
      <p className="text-gray-500 text-sm mb-8">Set your login credentials.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="you@example.lk"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={onChange}
            placeholder="Min. 8 characters"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase mb-1.5">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={onChange}
            placeholder="Repeat password"
            className={`w-full px-4 py-3 rounded-lg border outline-none transition-all text-sm font-medium ${formData.confirmPassword && !isPasswordMatch
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-200 focus:border-[#4F46E5] focus:ring-[#4F46E5]/20"
              }`}
          />
          {formData.confirmPassword && !isPasswordMatch && (
            <p className="text-red-500 text-xs mt-1.5 font-medium">Passwords do not match</p>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={onBack}
          disabled={loading}
          className="w-1/3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>←</span> Back
        </button>
        <button
          onClick={handleAction}
          disabled={!canContinue}
          className="w-2/3 bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] disabled:shadow-none"
        >
          {loading ? "Creating..." : onNext ? "Continue →" : "Create account"}
        </button>
      </div>
    </div>
  );
}