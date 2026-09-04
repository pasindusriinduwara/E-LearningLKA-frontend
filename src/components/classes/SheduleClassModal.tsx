"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { TeacherBatch } from "@/services/teacherService"; // or "@/lib/types/teacher"
import type { CreateScheduleData, DeliveryMode, RepeatInterval, ClassScheduleItem } from "@/lib/types/class";

interface Props {
    batches: TeacherBatch[];
    initialBatchId?: string;
    existingSchedules?: ClassScheduleItem[];
    onClose: () => void;
    onSubmit: (data: CreateScheduleData) => Promise<void>;
}

export function ScheduleClassModal({
    batches,
    initialBatchId,
    existingSchedules = [],
    onClose,
    onSubmit,
}: Props) {
    const [batchId, setBatchId] = useState(initialBatchId || batches[0]?.id || "");
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("16:30");
    const [endTime, setEndTime] = useState("18:30");
    const [location, setLocation] = useState("");
    const [mode, setMode] = useState<"IN_PERSON" | "ONLINE" | "HYBRID">("IN_PERSON");
    const [repeat, setRepeat] = useState<"ONCE" | "WEEKLY" | "BI_WEEKLY">("ONCE");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Time Order Pre-Check
        if (startTime >= endTime) {
            setError("Start time must be earlier than End time.");
            return;
        }

        // 2. Client-Side Overlap Pre-Check (against current active schedules)
        if (existingSchedules && existingSchedules.length > 0) {
            const hasConflict = existingSchedules.some((s) => {
                if (s.date !== date) return false;
                if (s.startTime && s.endTime) {
                    return startTime < s.endTime && s.startTime < endTime;
                }
                return false;
            });

            if (hasConflict) {
                setError("This time slot conflicts with an already scheduled class on this date.");
                return;
            }
        }

        // 3. Submit to backend
        try {
            setLoading(true);
            setError("");
            await onSubmit({
                batchId,
                title,
                date,
                startTime,
                endTime,
                location,
                mode,
                repeat,
            });
            onClose();
        } catch (err) {
            // Displays the detailed message from ScheduleConflictException (HTTP 409)
            setError(err instanceof Error ? err.message : "Failed to schedule class");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl p-6 relative">
                <button onClick={onClose} className="absolute right-5 top-5 p-1 rounded-full bg-gray-100 hover:bg-gray-200">
                    <X size={18} />
                </button>

                <p className="text-[11px] font-bold tracking-widest text-[#2D9F75] uppercase mb-1">Teacher Portal</p>
                <h2 className="text-2xl font-bold font-serif text-gray-900 mb-6">Schedule a class</h2>

                {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 1. Batch Selection */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Batch</label>
                        <div className="grid grid-cols-2 gap-2">
                            {batches.map((b) => (
                                <button
                                    type="button"
                                    key={b.id}
                                    onClick={() => setBatchId(b.id)}
                                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${batchId === b.id
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm"
                                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                        }`}
                                >
                                    <p className="font-bold">{b.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Topic */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Topic / Lesson Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Integration by Parts"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:border-emerald-500"
                            required
                        />
                    </div>

                    {/* 3. Date & Times */}
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-2 text-xs"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Start Time</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-2 text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">End Time</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-2 text-xs"
                            />
                        </div>
                    </div>

                    {/* 4. Location & Mode */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Location / Link</label>
                            <input
                                type="text"
                                placeholder="Studio 2 or Zoom link"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl p-2 text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Mode</label>
                            <div className="flex gap-1">
                                {(["IN_PERSON", "ONLINE", "HYBRID"] as const).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMode(m)}
                                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${mode === m ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600"
                                            }`}
                                    >
                                        {m === "IN_PERSON" ? "In person" : m === "ONLINE" ? "Online" : "Hybrid"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 5. Repeat */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Repeat</label>
                        <div className="flex gap-2">
                            {(
                                [
                                    { value: "ONCE", label: "Once" },
                                    { value: "WEEKLY", label: "Weekly" },
                                    { value: "BI_WEEKLY", label: "Bi-weekly" },
                                ] as const
                            ).map((r) => (
                                <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => setRepeat(r.value)}
                                    className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all border ${repeat === r.value
                                            ? "bg-[#2D9F75] border-[#2D9F75] text-white shadow-sm"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                        }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 6. Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#2D9F75] hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
                        >
                            {loading ? "Scheduling..." : "Schedule class"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
