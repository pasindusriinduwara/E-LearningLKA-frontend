"use client";

import { useAuth } from "@/context/AuthContext";

export function TeacherWelcomeBanner() {
  const { user } = useAuth();
  const teacherName = user?.name || "Teacher";
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="bg-[#133A2D] rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center text-white overflow-hidden relative">
      <div className="relative z-10">
        <p className="text-emerald-400/80 text-xs font-bold tracking-widest uppercase mb-2">{today}</p>
        <h1 className="text-4xl md:text-5xl font-extrabold font-serif mb-3">Good morning, {teacherName}.</h1>
        <p className="text-emerald-100/70 text-sm md:text-base max-w-lg mb-6">
          You have 2 classes today and 18 assignment submissions waiting for review.
        </p>
        <div className="flex gap-2 flex-wrap">
          <span className="bg-emerald-900/50 border border-emerald-700/50 text-emerald-100 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Mathematics
          </span>
          <span className="bg-blue-900/30 border border-blue-700/50 text-blue-100 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span> Combined Maths
          </span>
          <span className="bg-teal-900/30 border border-teal-700/50 text-teal-100 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span> Sinhala & English
          </span>
        </div>
      </div>
      
      <div className="mt-6 md:mt-0 bg-[#1A4537] border border-emerald-800/50 rounded-xl p-5 w-full md:w-64 relative z-10">
        <p className="text-emerald-400/80 text-[10px] font-bold tracking-widest uppercase mb-1">This Week</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold">8</span>
        </div>
        <p className="text-emerald-100/70 text-xs mb-4">classes scheduled</p>
        <div className="w-full bg-[#133A2D] h-1.5 rounded-full mb-2">
          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "37.5%" }}></div>
        </div>
        <p className="text-emerald-400/60 text-[10px] text-right">3 of 8 completed</p>
      </div>
    </div>
  );
}
