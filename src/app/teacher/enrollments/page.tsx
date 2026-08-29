// src/app/(student)/enrollment/page.tsx
"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { ClassCard } from "@/components/enrollment/ClassCard";

export default function EnrollmentPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const availableBatches = [
    { id: "b1", name: "A/L Batch A", subject: "Combined Mathematics", teacher: "Mr. K. Perera", schedule: "Tue & Fri • 6:00 – 8:00 PM", status: "AVAILABLE" },
    { id: "b2", name: "A/L Batch B", subject: "Pure Mathematics", teacher: "Mr. K. Perera", schedule: "Mon & Thu • 4:30 – 6:30 PM", status: "PENDING" }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Discover</p>
        <h1 className="text-4xl font-extrabold text-gray-900 font-serif">Enroll in Classes</h1>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search subjects or teachers..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableBatches.map((batch) => (
          <ClassCard key={batch.id} batch={batch} />
        ))}
      </div>
    </div>
  );
}