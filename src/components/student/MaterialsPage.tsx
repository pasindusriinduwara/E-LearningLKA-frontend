"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Video,
  Link2,
  Search,
  Download,
  CheckCircle2,
  X,
  FileCode,
  FolderOpen,
  ExternalLink,
  Layers,
  RefreshCw,
  GraduationCap,
  Eye,
  AlertCircle,
  Copy,
  Check,
  Filter,
  RotateCcw,
  Play,
} from "lucide-react";
import { getRecentMaterials } from "@/services/studentService";
import { getAvailableBatches, type AvailableBatch } from "@/services/batchService";
import { getMyEnrollmentStatuses } from "@/services/enrollmentService";
import { getEmbedVideoUrl } from "@/lib/videoUtils";
import type { LearningResource } from "@/lib/types/student";

export interface MaterialItem {
  id: string;
  batchId?: string;
  batchName: string;
  title: string;
  subject: string;
  teacher: string;
  type: "PDF" | "VIDEO" | "LINK" | "DOCUMENT";
  isNew?: boolean;
  hasAction?: boolean;
  date: string;
  size: string;
  downloadUrl?: string;
  description?: string;
  createdAt?: string;
}

function getSubjectBadgeColors(subject: string) {
  const s = subject.toLowerCase();
  if (s.includes("math")) return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
  if (s.includes("phys")) return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
  if (s.includes("chem")) return { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" };
  if (s.includes("bio")) return { bg: "#f0fdfa", text: "#0d9488", border: "#99f6e4" };
  if (s.includes("eng")) return { bg: "#faf5ff", text: "#7c3aed", border: "#e9d5ff" };
  return { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" };
}

function mapBackendMaterial(resource: LearningResource, index: number): MaterialItem {
  const rawType = (resource.type || "").toUpperCase();
  const fileUrl = (resource.fileUrl || "").trim();

  let type: MaterialItem["type"] = "PDF";
  if (
    rawType.includes("RECORDING") ||
    rawType.includes("VIDEO") ||
    rawType.includes("MP4") ||
    rawType.includes("ZOOM") ||
    rawType.includes("YOUTUBE") ||
    fileUrl.toLowerCase().includes("youtube.com") ||
    fileUrl.toLowerCase().includes("youtu.be") ||
    fileUrl.toLowerCase().includes("/video/") ||
    /\.(mp4|webm|ogg)(\?.*)?$/i.test(fileUrl)
  ) {
    type = "VIDEO";
  } else if (
    rawType.includes("PDF") ||
    fileUrl.toLowerCase().includes(".pdf")
  ) {
    type = "PDF";
  } else if (
    rawType.includes("DOC") ||
    rawType.includes("PRESENTATION") ||
    rawType.includes("PPT") ||
    rawType.includes("SHEET") ||
    rawType.includes("IMAGE") ||
    rawType.includes("FILE")
  ) {
    type = "DOCUMENT";
  } else if (
    rawType.includes("LINK") ||
    rawType.includes("URL")
  ) {
    type = "LINK";
  } else {
    type = fileUrl.toLowerCase().includes(".pdf") ? "PDF" : "DOCUMENT";
  }

  const isNew = resource.createdAt
    ? Date.now() - new Date(resource.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    : resource.time?.toLowerCase().includes("now") || resource.time?.toLowerCase().includes("today");

  const displaySize =
    type === "VIDEO"
      ? resource.size && resource.size !== "File"
        ? resource.size
        : "Class Recording"
      : resource.size || "File";

  return {
    id: resource.id || `mat-${index}`,
    batchId: resource.batchId,
    batchName: resource.batchName || "Enrolled Class",
    title: resource.title,
    subject: resource.subject || "General",
    teacher: resource.teacherName || "Instructor",
    type,
    isNew,
    hasAction: Boolean(resource.fileUrl),
    date: resource.time || "Recently uploaded",
    size: displaySize,
    downloadUrl: resource.fileUrl,
    description: `Official study resource for ${resource.batchName || "your class"}. Provided by ${resource.teacherName || "your instructor"}.`,
    createdAt: resource.createdAt,
  };
}

export function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [enrolledBatches, setEnrolledBatches] = useState<AvailableBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [materialsRes, batchesRes, statusesRes] = await Promise.all([
        getRecentMaterials(),
        getAvailableBatches().catch(() => []),
        getMyEnrollmentStatuses().catch(() => []),
      ]);

      const approvedBatchIds = new Set(
        statusesRes.filter((s) => s.status === "APPROVED").map((s) => s.batchId)
      );

      const activeBatches = batchesRes.filter((b) => approvedBatchIds.has(b.id));
      setEnrolledBatches(activeBatches);

      const mapped = materialsRes.map((r, idx) => mapBackendMaterial(r, idx));
      setMaterials(mapped);
    } catch (err: unknown) {
      console.error("Failed to load student materials:", err);
      setError(err instanceof Error ? err.message : "Failed to load study materials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Dynamically extract subjects from materials and enrolled batches
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.subject && m.subject.trim() && m.subject !== "General") {
        set.add(m.subject.trim());
      }
    });
    enrolledBatches.forEach((b) => {
      if (b.subject && b.subject.trim()) {
        set.add(b.subject.trim());
      }
    });
    return ["All", ...Array.from(set).sort()];
  }, [materials, enrolledBatches]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.teacher.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.batchName.toLowerCase().includes(q);

      const matchesBatch =
        selectedBatchId === "All" || item.batchId === selectedBatchId;

      const matchesSubject =
        selectedSubject === "All" ||
        item.subject.toLowerCase() === selectedSubject.toLowerCase();

      const matchesType =
        selectedType === "All" ||
        (selectedType === "DOCUMENT"
          ? item.type === "DOCUMENT" || item.type === "LINK"
          : item.type === selectedType);

      return matchesSearch && matchesBatch && matchesSubject && matchesType;
    });
  }, [materials, searchQuery, selectedBatchId, selectedSubject, selectedType]);

  const stats = useMemo(() => {
    const total = materials.length;
    const pdfs = materials.filter((item) => item.type === "PDF").length;
    const videos = materials.filter((item) => item.type === "VIDEO").length;
    const docs = materials.filter(
      (item) => item.type === "DOCUMENT" || item.type === "LINK"
    ).length;
    return { total, pdfs, videos, docs };
  }, [materials]);

  const newCount = useMemo(() => {
    return materials.filter((m) => m.isNew).length;
  }, [materials]);

  const hasActiveFilters =
    selectedType !== "All" ||
    selectedSubject !== "All" ||
    selectedBatchId !== "All" ||
    searchQuery.trim() !== "";

  function resetAllFilters() {
    setSearchQuery("");
    setSelectedBatchId("All");
    setSelectedSubject("All");
    setSelectedType("All");
  }

  function handleDownload(item: MaterialItem) {
    if (item.downloadUrl) {
      window.open(item.downloadUrl, "_blank", "noopener,noreferrer");
      setDownloadToast(`Opening "${item.title}"...`);
    } else {
      setDownloadToast(`File link unavailable for "${item.title}".`);
    }
    setTimeout(() => {
      setDownloadToast(null);
    }, 3500);
  }

  function handleCopyLink(url?: string) {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith(".mp4") ||
      lower.endsWith(".webm") ||
      lower.endsWith(".ogg") ||
      lower.includes("/video/upload/") ||
      lower.includes("youtube.com") ||
      lower.includes("youtu.be")
    );
  };

  const isPdfUrl = (url?: string) => {
    if (!url) return false;
    return url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("/raw/upload/");
  };

  return (
    <div className="materials-page-wrapper">
      {/* Header */}
      <header className="materials-header">
        <div>
          <p className="materials-eyebrow">STUDY RESOURCES • ENROLLED CLASSES</p>
          <h1 className="materials-title">Materials</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadData()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-sm"
            title="Refresh materials"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>
          <div className="materials-new-badge">
            <GraduationCap size={15} style={{ marginRight: 6 }} />
            <span>
              {materials.length} {materials.length === 1 ? "resource" : "resources"}
              {newCount > 0 && ` • ${newCount} new`}
            </span>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top 4 Stat Metric Cards */}
      <div className="materials-stats-grid">
        <button
          type="button"
          className={`stat-card ${selectedType === "All" ? "stat-card-active ring-2 ring-[#4f6df5]/20" : ""}`}
          onClick={() => setSelectedType("All")}
          title="Show all materials"
        >
          <div className="stat-icon-wrap stat-icon-blue">
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <strong className="stat-number">{loading ? "—" : stats.total}</strong>
            <span className="stat-label">Total files</span>
          </div>
        </button>

        <button
          type="button"
          className={`stat-card ${selectedType === "PDF" ? "stat-card-active ring-2 ring-red-500/20" : ""}`}
          onClick={() => setSelectedType(selectedType === "PDF" ? "All" : "PDF")}
          title={selectedType === "PDF" ? "Click to clear filter" : "Filter by PDF Notes"}
        >
          <div className="stat-icon-wrap stat-icon-red">
            <FileText size={22} />
          </div>
          <div className="stat-info">
            <strong className="stat-number">{loading ? "—" : stats.pdfs}</strong>
            <span className="stat-label">PDF Notes</span>
          </div>
        </button>

        <button
          type="button"
          className={`stat-card ${selectedType === "VIDEO" ? "stat-card-active ring-2 ring-blue-500/20" : ""}`}
          onClick={() => setSelectedType(selectedType === "VIDEO" ? "All" : "VIDEO")}
          title={selectedType === "VIDEO" ? "Click to clear filter" : "Filter by Lectures & Videos"}
        >
          <div className="stat-icon-wrap stat-icon-cyan">
            <Video size={22} />
          </div>
          <div className="stat-info">
            <strong className="stat-number">{loading ? "—" : stats.videos}</strong>
            <span className="stat-label">Lectures & Videos</span>
          </div>
        </button>

        <button
          type="button"
          className={`stat-card ${
            selectedType === "DOCUMENT" ? "stat-card-active ring-2 ring-emerald-500/20" : ""
          }`}
          onClick={() =>
            setSelectedType(selectedType === "DOCUMENT" ? "All" : "DOCUMENT")
          }
          title={selectedType === "DOCUMENT" ? "Click to clear filter" : "Filter by Docs & Links"}
        >
          <div className="stat-icon-wrap stat-icon-green">
            <Link2 size={22} />
          </div>
          <div className="stat-info">
            <strong className="stat-number">{loading ? "—" : stats.docs}</strong>
            <span className="stat-label">Docs & Links</span>
          </div>
        </button>
      </div>

      {/* Controls Bar (Search & Filter Tabs) */}
      <div className="materials-controls-bar flex-wrap gap-4">
        {/* Search */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by topic, teacher, subject, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Dynamic Class/Batch Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="h-12 px-4 py-2 bg-white border border-[#edf0f5] rounded-xl text-sm font-semibold text-gray-700 outline-none focus:border-[#4f6df5] transition-all cursor-pointer shadow-sm pr-9 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                backgroundSize: "14px",
              }}
            >
              <option value="All">All My Classes</option>
              {enrolledBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Subject Filter Tabs */}
        <div className="subject-filter-tabs overflow-x-auto max-w-full pb-1">
          {availableSubjects.map((subject) => {
            const isActive = selectedSubject === subject;
            return (
              <button
                key={subject}
                type="button"
                className={`subject-tab whitespace-nowrap ${
                  isActive ? "subject-tab-active" : ""
                }`}
                onClick={() => setSelectedSubject(subject)}
              >
                {subject}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filters Bar (Prevents UI Disorientation) */}
      {hasActiveFilters && (
        <div className="mb-6 px-4 py-3 bg-gray-50/80 border border-gray-200/70 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Filter size={12} /> Active Filters:
            </span>

            {selectedType !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold shadow-xs">
                Type: {selectedType === "VIDEO" ? "Videos" : selectedType === "PDF" ? "PDFs" : "Docs & Links"}
                <button
                  type="button"
                  onClick={() => setSelectedType("All")}
                  className="hover:text-red-500 transition-colors"
                  title="Remove type filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {selectedSubject !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold shadow-xs">
                Subject: {selectedSubject}
                <button
                  type="button"
                  onClick={() => setSelectedSubject("All")}
                  className="hover:text-red-500 transition-colors"
                  title="Remove subject filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {selectedBatchId !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold shadow-xs">
                Class: {enrolledBatches.find((b) => b.id === selectedBatchId)?.name || "Selected"}
                <button
                  type="button"
                  onClick={() => setSelectedBatchId("All")}
                  className="hover:text-red-500 transition-colors"
                  title="Remove class filter"
                >
                  <X size={13} />
                </button>
              </span>
            )}

            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold shadow-xs">
                Search: &ldquo;{searchQuery}&rdquo;
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="hover:text-red-500 transition-colors"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={resetAllFilters}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            <RotateCcw size={12} /> Clear all filters
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="materials-grid">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm animate-pulse flex flex-col justify-between min-h-[180px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="w-24 h-3 bg-gray-200 rounded" />
                  <div className="w-16 h-2 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="my-4 space-y-2">
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
                <div className="w-1/2 h-3 bg-gray-100 rounded" />
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between">
                <div className="w-20 h-3 bg-gray-100 rounded" />
                <div className="w-12 h-3 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Materials Grid */}
      {!loading && (
        <div className="materials-grid">
          {filteredMaterials.map((item) => {
            const badgeColors = getSubjectBadgeColors(item.subject);
            return (
              <article className="material-card" key={item.id}>
                <div className="material-card-top">
                  <div
                    className={`material-type-icon ${
                      item.type === "PDF"
                        ? "type-icon-pdf"
                        : item.type === "VIDEO"
                        ? "type-icon-video"
                        : "type-icon-link"
                    }`}
                  >
                    {item.type === "PDF" && <FileText size={22} />}
                    {item.type === "VIDEO" && <Video size={22} />}
                    {(item.type === "LINK" || item.type === "DOCUMENT") && (
                      <Link2 size={22} />
                    )}
                  </div>

                  <div className="material-meta-info">
                    <div className="subject-badge-line">
                      <span
                        className="subject-tag"
                        style={{
                          background: badgeColors.bg,
                          color: badgeColors.text,
                          borderColor: badgeColors.border,
                          borderWidth: "1px",
                          borderStyle: "solid",
                          padding: "2px 8px",
                          borderRadius: "8px",
                          fontWeight: 700,
                          fontSize: "10px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {item.subject.toUpperCase()}
                      </span>
                      {item.isNew && <span className="new-badge">NEW</span>}
                    </div>
                    <span className="type-sublabel flex items-center gap-1.5">
                      <GraduationCap size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate">{item.batchName}</span>
                    </span>
                  </div>

                  {item.hasAction && (
                    <button
                      type="button"
                      className="quick-action-btn cursor-pointer"
                      title={item.type === "VIDEO" ? `Watch ${item.title}` : `Download ${item.title}`}
                      aria-label={item.type === "VIDEO" ? `Watch ${item.title}` : `Download ${item.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.type === "VIDEO") {
                          setPreviewMaterial(item);
                        } else {
                          handleDownload(item);
                        }
                      }}
                    >
                      {item.type === "VIDEO" ? (
                        <Play size={15} className="fill-current text-[#4f6df5]" />
                      ) : (
                        <Download size={18} />
                      )}
                    </button>
                  )}
                </div>

                <div
                  className="material-card-content"
                  onClick={() => setPreviewMaterial(item)}
                >
                  <h3 className="material-title">{item.title}</h3>
                  <p className="material-teacher">Instructor: {item.teacher}</p>
                </div>

                <div className="material-card-footer">
                  <span className="material-date">{item.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="material-size">{item.size}</span>
                    <button
                      type="button"
                      onClick={() => setPreviewMaterial(item)}
                      className="text-xs font-semibold text-[#4f6df5] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {item.type === "VIDEO" ? (
                        <>
                          <Play size={12} className="fill-current" /> Watch
                        </>
                      ) : (
                        <>
                          <Eye size={13} /> View
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Empty State: Filter Returned 0 Items */}
          {filteredMaterials.length === 0 && materials.length > 0 && (
            <div className="materials-empty-state">
              {selectedType === "VIDEO" ? (
                <Video size={44} className="empty-icon-art text-blue-500" />
              ) : selectedType === "PDF" ? (
                <FileText size={44} className="empty-icon-art text-red-500" />
              ) : selectedType === "DOCUMENT" ? (
                <Link2 size={44} className="empty-icon-art text-emerald-500" />
              ) : (
                <FileCode size={44} className="empty-icon-art" />
              )}

              <h3>
                {selectedType === "VIDEO"
                  ? "No video lectures available"
                  : selectedType === "PDF"
                  ? "No PDF notes found"
                  : selectedType === "DOCUMENT"
                  ? "No documents or links found"
                  : "No matching materials"}
              </h3>

              <p className="max-w-md">
                {selectedType !== "All"
                  ? `Your instructors haven't uploaded any ${
                      selectedType === "VIDEO"
                        ? "video lecture recordings"
                        : selectedType === "PDF"
                        ? "PDF notes"
                        : "documents or links"
                    } for this selection yet. You can view all other available materials.`
                  : "Try adjusting your search query, class, or subject filters to find what you need."}
              </p>

              <div className="flex items-center gap-3">
                {selectedType !== "All" && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-[#4f6df5] hover:bg-[#3d5be0] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    onClick={() => setSelectedType("All")}
                  >
                    View All {stats.total} Files
                  </button>
                )}
                <button
                  type="button"
                  className="reset-filters-btn"
                  onClick={resetAllFilters}
                >
                  Reset all filters
                </button>
              </div>
            </div>
          )}

          {/* Empty State: No Materials In Enrolled Classes */}
          {filteredMaterials.length === 0 &&
            materials.length === 0 &&
            enrolledBatches.length > 0 && (
              <div className="materials-empty-state">
                <FolderOpen size={48} className="empty-icon-art text-gray-400" />
                <h3>No materials uploaded yet</h3>
                <p>
                  Your teachers have not uploaded any study resources for your
                  enrolled classes yet. Check back soon!
                </p>
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  Refresh Library
                </button>
              </div>
            )}

          {/* Empty State: Not Enrolled in Any Class */}
          {filteredMaterials.length === 0 &&
            materials.length === 0 &&
            enrolledBatches.length === 0 && (
              <div className="materials-empty-state">
                <GraduationCap size={48} className="empty-icon-art text-gray-400" />
                <h3>No enrolled classes found</h3>
                <p>
                  You are not actively enrolled in any classes yet. Enroll in a class
                  to access its exclusive lecture notes, videos, and materials.
                </p>
                <Link
                  href="/classes"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm inline-flex items-center gap-2"
                >
                  <GraduationCap size={16} /> Browse Available Classes
                </Link>
              </div>
            )}
        </div>
      )}

      {/* Download/Open Toast */}
      {downloadToast && (
        <div className="download-toast">
          <CheckCircle2 size={18} />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Production-Grade Preview & Resource Modal */}
      {previewMaterial && (
        <div
          className="payment-modal-backdrop"
          onClick={() => setPreviewMaterial(null)}
        >
          <div
            className="payment-modal-card max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-modal-head">
              <div>
                <span className="text-[11px] font-bold text-[#4f6df5] uppercase tracking-wider">
                  {previewMaterial.batchName}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                  {previewMaterial.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {previewMaterial.subject} • Instructor: {previewMaterial.teacher}
                </p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setPreviewMaterial(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="payment-modal-body">
              {/* Meta Grid */}
              <div className="material-preview-meta">
                <div>
                  <span>Resource Type</span>
                  <strong>{previewMaterial.type}</strong>
                </div>
                <div>
                  <span>Uploaded On</span>
                  <strong>{previewMaterial.date}</strong>
                </div>
                <div>
                  <span>File Size</span>
                  <strong>{previewMaterial.size}</strong>
                </div>
              </div>

              {/* Description */}
              <div className="material-desc-box">
                <p>{previewMaterial.description}</p>
              </div>

              {/* Interactive In-App Media Preview */}
              {previewMaterial.downloadUrl && (
                <div className="mb-4">
                  {/* Video & Class Recording Streaming Preview */}
                  {previewMaterial.type === "VIDEO" ? (
                    (() => {
                      const { embedUrl, isDirectVideo, originalUrl } = getEmbedVideoUrl(previewMaterial.downloadUrl);
                      return (
                        <div className="overflow-hidden rounded-xl bg-black border border-gray-200 aspect-video max-h-[360px] w-full flex items-center justify-center">
                          {isDirectVideo ? (
                            <video
                              controls
                              className="w-full h-full object-contain"
                              src={embedUrl}
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : embedUrl ? (
                            <iframe
                              src={embedUrl}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={previewMaterial.title}
                            />
                          ) : (
                            <div className="p-6 text-center text-white text-xs">
                              <Video size={32} className="mx-auto mb-2 text-blue-400" />
                              <p className="font-bold mb-1">Class Video Recording</p>
                              <p className="text-gray-400 mb-3">{previewMaterial.title}</p>
                              <a
                                href={originalUrl || previewMaterial.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
                              >
                                <ExternalLink size={14} /> Open Recording Stream
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : isPdfUrl(previewMaterial.downloadUrl) ? (
                    /* PDF Document Preview Banner */
                    <div className="p-4 bg-red-50/60 border border-red-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            PDF Document
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Ready to view or download
                          </p>
                        </div>
                      </div>
                      <a
                        href={previewMaterial.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-lg shadow-sm"
                      >
                        <ExternalLink size={13} /> Open in New Tab
                      </a>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="modal-actions-row flex items-center justify-between pt-2 border-t border-gray-100">
                {previewMaterial.downloadUrl ? (
                  <button
                    type="button"
                    onClick={() => handleCopyLink(previewMaterial.downloadUrl)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                    <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    onClick={() => setPreviewMaterial(null)}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="confirm-pay-btn cursor-pointer"
                    onClick={() => {
                      handleDownload(previewMaterial);
                    }}
                  >
                    {previewMaterial.type === "LINK" ? (
                      <>
                        <ExternalLink size={16} style={{ marginRight: 8 }} />
                        Open External Resource
                      </>
                    ) : (
                      <>
                        <Download size={16} style={{ marginRight: 8 }} />
                        {previewMaterial.downloadUrl ? "Download / Open Resource" : "Resource Unavailable"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
