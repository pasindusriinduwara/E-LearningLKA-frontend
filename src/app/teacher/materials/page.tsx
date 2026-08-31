"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { UploadMaterialForm } from "@/components/materials/UploadMaterial";
import type { Material } from "@/lib/types/materials";
import {
  getTeacherBatches,
  getTeacherMaterials,
  type TeacherBatch,
  type TeacherMaterial,
} from "@/services/teacherService";

function toMaterialType(type?: string): Material["type"] {
  return type?.toLowerCase().includes("video") ? "video" : "document";
}

function mapMaterial(material: TeacherMaterial, batches: TeacherBatch[]): Material {
  const batch = batches.find((item) => item.id === material.batchId);
  return {
    id: material.id,
    type: toMaterialType(material.type),
    batch: batch?.name || "Unknown batch",
    title: material.title,
    subject: material.subject || "Unspecified subject",
    date: material.time || "Recently uploaded",
    size: material.size,
    fileUrl: material.fileUrl,
    isRestricted: true,
  };
}

export default function MaterialsPage() {
  const [activeBatch, setActiveBatch] = useState("All batches");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [batchResponse, materialResponse] = await Promise.all([
        getTeacherBatches(),
        getTeacherMaterials(),
      ]);
      setBatches(batchResponse);
      setMaterials(materialResponse.map((material) => mapMaterial(material, batchResponse)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {

    void loadMaterials();
  }, [loadMaterials]);

  const filteredMaterials = materials.filter((material) => {
    const matchesBatch = activeBatch === "All batches" || material.batch === activeBatch;
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBatch && matchesSearch;
  });
  const batchOptions = ["All batches", ...batches.map((batch) => batch.name)];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Course Content</p>
          <h1 className="text-4xl font-extrabold text-gray-900 font-serif">Materials</h1>
        </div>
        {!isUploading && (
          <button onClick={() => setIsUploading(true)} className="bg-[#2D9F75] hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap">
            <Plus size={18} /> Upload material
          </button>
        )}
      </div>

      {isUploading && (
        <UploadMaterialForm
          onCancel={() => setIsUploading(false)}
          onUploaded={() => void loadMaterials()}
        />
      )}

      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search materials..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 hide-scrollbar">
          {batchOptions.map((batch) => (
            <button key={batch} onClick={() => setActiveBatch(batch)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${activeBatch === batch ? "bg-[#2D9F75] text-white border-[#2D9F75]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
              {batch}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="rounded-2xl bg-white p-8 text-sm text-gray-500">Loading materials...</p>
      ) : filteredMaterials.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-sm text-gray-500">No materials found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => <MaterialCard key={material.id} material={material} />)}
        </div>
      )}
    </div>
  );
}
