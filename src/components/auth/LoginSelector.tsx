import React from "react";
import { GraduationCap, Presentation } from "lucide-react";

interface LoginRoleSelectorProps {
    role: "student" | "teacher";
    onRoleChange: (role: "student" | "teacher") => void;
}

export function LoginRoleSelector({ role, onRoleChange }: LoginRoleSelectorProps) {
    return (
        <div className="flex p-1 bg-white border border-gray-200 rounded-xl mb-8 shadow-sm">
            <button
                type="button"
                onClick={() => onRoleChange("student")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${role === "student" ? "bg-[#4F46E5] text-white shadow-md" : "text-gray-500 hover:text-gray-700"
                    }`}
            >
                <GraduationCap size={18} className={role === "student" ? "text-white" : "text-gray-400"} />
                Student
            </button>
            <button
                type="button"
                onClick={() => onRoleChange("teacher")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${role === "teacher" ? "bg-[#4F46E5] text-white shadow-md" : "text-gray-500 hover:text-gray-700"
                    }`}
            >
                <Presentation size={18} className={role === "teacher" ? "text-white" : "text-amber-500"} />
                Teacher
            </button>
        </div>
    );
}