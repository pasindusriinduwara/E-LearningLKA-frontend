"use client";

import React, { useState, useEffect, useRef } from "react";
import type { RegisterFormData } from "@/lib/types/auth";
import { getSubjects } from "@/services/subjectService";
import { Plus, X, Search, Check, Sparkles, AlertCircle, BookOpen, Trash2 } from "lucide-react";

interface TeacherDetailsStepProps {
    formData: RegisterFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onToggleSubject: (subject: string) => void;
    onAddSubject?: (subject: string) => void;
    onRemoveSubject?: (subject: string) => void;
    onClearSubjects?: () => void;
    onBack: () => void;
    onNext: () => void;
    loading?: boolean;
    error?: string;
}

const DEFAULT_POPULAR_SUBJECTS = [
    "Combined Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Information Technology (ICT)",
    "Pure Mathematics",
    "Applied Mathematics",
    "Accounting",
    "Business Studies",
    "Economics",
    "English",
    "Sinhala",
    "Tamil",
    "History",
    "Geography",
    "Logic & Scientific Method"
];

export function TeacherDetailsStep({
    formData,
    onChange,
    onToggleSubject,
    onAddSubject,
    onRemoveSubject,
    onClearSubjects,
    onBack,
    onNext,
    loading,
    error
}: TeacherDetailsStepProps) {
    const [knownSubjects, setKnownSubjects] = useState<string[]>(DEFAULT_POPULAR_SUBJECTS);
    const [inputValue, setInputValue] = useState("");
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch existing platform subjects to augment suggestions
    useEffect(() => {
        let mounted = true;
        getSubjects()
            .then((list) => {
                if (!mounted || !Array.isArray(list)) return;
                const fetchedNames = list.map((s) => s.name.trim()).filter(Boolean);
                setKnownSubjects((prev) => {
                    const combined = new Set([...prev, ...fetchedNames]);
                    return Array.from(combined);
                });
            })
            .catch(() => {
                // Graceful fallback to DEFAULT_POPULAR_SUBJECTS
            });
        return () => {
            mounted = false;
        };
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setHighlightedIndex(-1);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Normalizes subject string: strips extra spaces, standardizes casing
    const cleanSubjectName = (str: string) => {
        return str
            .trim()
            .replace(/\s+/g, " ");
    };

    const addSubject = (subjectName: string) => {
        const clean = cleanSubjectName(subjectName);
        if (!clean) return;

        if (clean.length < 2) {
            setValidationMessage("Subject name must be at least 2 characters.");
            return;
        }

        if (clean.length > 80) {
            setValidationMessage("Subject name cannot exceed 80 characters.");
            return;
        }

        const isDuplicate = formData.subjects.some(
            (s) => s.toLowerCase() === clean.toLowerCase()
        );

        if (isDuplicate) {
            setValidationMessage(`"${clean}" is already in your subjects list.`);
            return;
        }

        setValidationMessage(null);

        if (onAddSubject) {
            onAddSubject(clean);
        } else {
            onToggleSubject(clean);
        }

        // Add to knownSubjects list if new
        if (!knownSubjects.some((s) => s.toLowerCase() === clean.toLowerCase())) {
            setKnownSubjects((prev) => [...prev, clean]);
        }

        setInputValue("");
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
    };

    const removeSubject = (subjectName: string) => {
        setValidationMessage(null);
        if (onRemoveSubject) {
            onRemoveSubject(subjectName);
        } else {
            onToggleSubject(subjectName);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
                addSubject(filteredSuggestions[highlightedIndex]);
            } else if (inputValue.trim()) {
                addSubject(inputValue);
            }
        } else if (e.key === ",") {
            e.preventDefault();
            if (inputValue.trim()) {
                addSubject(inputValue);
            }
        } else if (e.key === "Backspace" && !inputValue && formData.subjects.length > 0) {
            // Remove last item on backspace when input is empty
            removeSubject(formData.subjects[formData.subjects.length - 1]);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!isDropdownOpen) {
                setIsDropdownOpen(true);
            } else {
                setHighlightedIndex((prev) =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : 0
                );
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredSuggestions.length - 1
            );
        } else if (e.key === "Escape") {
            setIsDropdownOpen(false);
            setHighlightedIndex(-1);
        }
    };

    // Filter suggestions based on query
    const trimmedInput = inputValue.trim().toLowerCase();
    const filteredSuggestions = knownSubjects
        .filter((subj) => {
            const matchesQuery = !trimmedInput || subj.toLowerCase().includes(trimmedInput);
            const notAlreadySelected = !formData.subjects.some(
                (s) => s.toLowerCase() === subj.toLowerCase()
            );
            return matchesQuery && notAlreadySelected;
        })
        .slice(0, 6);

    const isExactMatch = knownSubjects.some(
        (subj) => subj.toLowerCase() === trimmedInput
    );
    const showAddNewOption = trimmedInput.length >= 2 && !isExactMatch;

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-serif">Teaching profile</h2>
            <p className="text-gray-500 text-sm mb-6">
                Add the subjects you teach. You can pick from popular subjects or type any custom subject.
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-6">
                {/* 1. Selected Subjects Tag Chips */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-500 tracking-wider uppercase">
                                Selected Subjects
                            </label>
                            <span className="px-2 py-0.5 text-xs font-bold bg-[#EEF2FF] text-[#4F46E5] rounded-full">
                                {formData.subjects.length}
                            </span>
                        </div>
                        {formData.subjects.length > 2 && (
                            <button
                                type="button"
                                onClick={() => (onClearSubjects ? onClearSubjects() : formData.subjects.forEach(removeSubject))}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 font-medium"
                            >
                                <Trash2 size={12} /> Clear all
                            </button>
                        )}
                    </div>

                    {formData.subjects.length === 0 ? (
                        <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center bg-gray-50/50">
                            <BookOpen size={24} className="mx-auto text-gray-300 mb-1.5" />
                            <p className="text-xs text-gray-500 font-medium">No subjects added yet.</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Type a subject name below or click on any recommended subject.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {formData.subjects.map((subject) => {
                                const isCustom = !DEFAULT_POPULAR_SUBJECTS.some(
                                    (p) => p.toLowerCase() === subject.toLowerCase()
                                );
                                return (
                                    <span
                                        key={subject}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE] shadow-2xs transition-all hover:bg-indigo-100"
                                    >
                                        <span>{subject}</span>
                                        {isCustom && (
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-indigo-200/80 text-indigo-800 rounded">
                                                Custom
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeSubject(subject)}
                                            aria-label={`Remove ${subject}`}
                                            className="ml-0.5 p-0.5 hover:bg-indigo-300/60 rounded-full text-indigo-500 hover:text-indigo-900 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. Combobox / Manual Subject Input */}
                <div ref={containerRef} className="relative">
                    <label className="block text-xs font-bold text-gray-500 tracking-wider uppercase mb-1.5">
                        Add Subject Manually
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                <Search size={16} />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setValidationMessage(null);
                                    setIsDropdownOpen(true);
                                    setHighlightedIndex(-1);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a subject name (e.g., Robotics, French, Statistics)..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all text-sm font-medium bg-white"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => addSubject(inputValue)}
                            disabled={!inputValue.trim()}
                            className="px-4 py-2.5 bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                            <Plus size={16} />
                            <span>Add</span>
                        </button>
                    </div>

                    <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                        <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 text-[10px] font-mono">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600 text-[10px] font-mono">,</kbd> to add instantly.</span>
                    </p>

                    {/* Inline Validation Alert */}
                    {validationMessage && (
                        <div className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{validationMessage}</span>
                        </div>
                    )}

                    {/* Live Autocomplete / Suggestions Dropdown */}
                    {isDropdownOpen && (filteredSuggestions.length > 0 || showAddNewOption) && (
                        <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                            {filteredSuggestions.map((suggestion, idx) => {
                                const isHighlighted = idx === highlightedIndex;
                                return (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            addSubject(suggestion);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                                            isHighlighted ? "bg-[#EEF2FF] text-[#4F46E5] font-semibold" : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={14} className="text-gray-400" />
                                            <span>{suggestion}</span>
                                        </div>
                                        <span className="text-[11px] text-gray-400 font-normal">Select</span>
                                    </button>
                                );
                            })}

                            {showAddNewOption && (
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        addSubject(inputValue);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 bg-indigo-50/60 hover:bg-indigo-100/70 text-[#4F46E5] font-medium border-t border-indigo-100 transition-colors"
                                >
                                    <Sparkles size={15} className="text-[#4F46E5]" />
                                    <span>
                                        Add custom subject: <strong className="font-semibold text-indigo-900">&quot;{cleanSubjectName(inputValue)}&quot;</strong>
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Popular / Recommended Subjects Cloud */}
                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <label className="text-xs font-bold text-gray-500 tracking-wider uppercase flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-500" />
                            <span>Quick Recommendations</span>
                        </label>
                        <span className="text-[11px] text-gray-400">Click to add/remove</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {DEFAULT_POPULAR_SUBJECTS.map((subject) => {
                            const isSelected = formData.subjects.some(
                                (s) => s.toLowerCase() === subject.toLowerCase()
                            );
                            return (
                                <button
                                    key={subject}
                                    type="button"
                                    onClick={() => onToggleSubject(subject)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                                        isSelected
                                            ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {isSelected ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
                                    <span>{subject}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Other Teacher Profile Fields */}
                <div className="pt-2 border-t border-gray-100 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 tracking-wider uppercase mb-1.5">
                            Qualification <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="qualification"
                            value={formData.qualification}
                            onChange={onChange}
                            placeholder="e.g., B.Sc. Mathematics, University of Colombo"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all text-sm font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 tracking-wider uppercase mb-1.5">
                            Years of Experience
                        </label>
                        <input
                            type="text"
                            name="experience"
                            value={formData.experience}
                            onChange={onChange}
                            placeholder="e.g., 8 years"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all text-sm font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 tracking-wider uppercase mb-1.5">
                            Institute / Tuition Centre Name
                        </label>
                        <input
                            type="text"
                            name="institute"
                            value={formData.institute}
                            onChange={onChange}
                            placeholder="e.g., Perera Tuition Centre"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 outline-none transition-all text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
                <button
                    onClick={onBack}
                    disabled={loading}
                    className="w-1/3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <span>←</span> Back
                </button>
                <button
                    onClick={onNext}
                    disabled={formData.subjects.length === 0 || !formData.qualification?.trim() || loading}
                    className="w-2/3 bg-[#4F46E5] hover:bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] text-sm"
                >
                    Continue <span>→</span>
                </button>
            </div>
        </div>
    );
}