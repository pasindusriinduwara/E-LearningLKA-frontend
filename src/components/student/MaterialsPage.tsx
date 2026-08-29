"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Video,
  Link2,
  Tablet,
  Search,
  Download,
  ExternalLink,
  CheckCircle2,
  X,
  FileCode,
} from "lucide-react";

export interface MaterialItem {
  id: string;
  title: string;
  subject: "Mathematics" | "Chemistry" | "Physics";
  teacher: string;
  type: "PDF" | "VIDEO" | "LINK";
  isNew?: boolean;
  hasAction?: boolean;
  date: string;
  size: string;
  downloadUrl?: string;
  description?: string;
}

const initialMaterials: MaterialItem[] = [
  {
    id: "mat-01",
    title: "Integration — Complete Notes",
    subject: "Mathematics",
    teacher: "Mr. K. Perera",
    type: "PDF",
    isNew: true,
    date: "25 Aug 2026",
    size: "2.4 MB",
    description: "Comprehensive step-by-step calculus integration formulas, substitution rules, and solved past paper questions.",
  },
  {
    id: "mat-02",
    title: "Organic Reactions — Cheat Sheet",
    subject: "Chemistry",
    teacher: "Ms. A. Fernando",
    type: "PDF",
    isNew: true,
    date: "24 Aug 2026",
    size: "1.1 MB",
    description: "Summary maps of aliphatic and aromatic mechanisms, reagents, reaction conditions, and conversion charts.",
  },
  {
    id: "mat-03",
    title: "Electromagnetism — Lecture Recording",
    subject: "Physics",
    teacher: "Mr. R. Silva",
    type: "VIDEO",
    isNew: true,
    hasAction: true,
    date: "23 Aug 2026",
    size: "340 MB",
    description: "Full recording of the live studio session explaining Faraday's Law, Lenz's Law, and electromagnetic induction problems.",
  },
  {
    id: "mat-04",
    title: "Differential Equations — Practice Paper",
    subject: "Mathematics",
    teacher: "Mr. K. Perera",
    type: "PDF",
    isNew: false,
    date: "20 Aug 2026",
    size: "980 KB",
    description: "First and second order differential equation model papers with detailed model answers and marking criteria.",
  },
  {
    id: "mat-05",
    title: "Wave Optics Interactive Simulation",
    subject: "Physics",
    teacher: "Mr. R. Silva",
    type: "LINK",
    isNew: false,
    date: "18 Aug 2026",
    size: "Web link",
    description: "Interactive visual lab simulation of Young's double-slit experiment and diffraction grating patterns.",
  },
  {
    id: "mat-06",
    title: "Thermodynamics Quick Revision Summary",
    subject: "Chemistry",
    teacher: "Ms. A. Fernando",
    type: "PDF",
    isNew: false,
    date: "15 Aug 2026",
    size: "1.8 MB",
    description: "Enthalpy cycles, Gibbs free energy calculations, and Hess's law practice problems for A/L revision.",
  },
];

export function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Filtered list based on Search, Subject tab, and Type card selection
  const filteredMaterials = useMemo(() => {
    return initialMaterials.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject =
        selectedSubject === "All" || item.subject === selectedSubject;

      const matchesType =
        selectedType === "All" || item.type === selectedType;

      return matchesSearch && matchesSubject && matchesType;
    });
  }, [searchQuery, selectedSubject, selectedType]);

  const stats = useMemo(() => {
    const total = 24;
    const pdfs = 16;
    const videos = 5;
    const links = 3;
    return { total, pdfs, videos, links };
  }, []);

  function handleDownload(item: MaterialItem) {
    setDownloadToast(`Downloading "${item.title}" (${item.size})...`);
    setTimeout(() => {
      setDownloadToast(null);
    }, 3000);
  }

  return (
    <div className="materials-page-wrapper">
      {/* Page Header */}
      <header className="materials-header">
        <div>
          <p className="materials-eyebrow">STUDY RESOURCES</p>
          <h1 className="materials-title">Materials</h1>
        </div>
        <div className="materials-new-badge">
          <span>3 new since last visit</span>
        </div>
      </header>

      {/* Top 4 Stat Metric Cards */}
      <div className="materials-stats-grid">
        {/* Total Files */}
        <button
          type="button"
          className="stat-card"
          onClick={() => setSelectedType("All")}
        >
          <div className="stat-icon-wrap stat-icon-blue">
            <Tablet size={22} />
          </div>
          <div className="stat-info">
            <strong className="stat-number">{stats.total}</strong>
            <span className="stat-label">Total files</span>
          </div>
        </button>

        {/* PDFs */}
        <button
          type="button"
          className={`stat-card ${selectedType === "PDF" ? "stat-card-active" : ""}`}
          onClick={() => setSelectedType(selectedType === "PDF" ? "All" : "PDF")}
        >
          <div className="stat-icon-wrap stat-icon-red">
            <FileText size={22} />
          </div>
          <div className="stat-info">
            <strong className="stat-number">{stats.pdfs}</strong>
            <span className="stat-label">PDFs</span>
          </div>
        </button>

        {/* Videos */}
        <button
          type="button"
          className={`stat-card ${selectedType === "VIDEO" ? "stat-card-active" : ""}`}
          onClick={() => setSelectedType(selectedType === "VIDEO" ? "All" : "VIDEO")}
        >
          <div className="stat-icon-wrap stat-icon-cyan">
            <Video size={22} />
          </div>
          <div className="stat-info">
            <strong className="stat-number">{stats.videos}</strong>
            <span className="stat-label">Videos</span>
          </div>
        </button>

        {/* Links */}
        <button
          type="button"
          className={`stat-card ${selectedType === "LINK" ? "stat-card-active" : ""}`}
          onClick={() => setSelectedType(selectedType === "LINK" ? "All" : "LINK")}
        >
          <div className="stat-icon-wrap stat-icon-green">
            <Link2 size={22} />
          </div>
          <div className="stat-info">
            <strong className="stat-number">{stats.links}</strong>
            <span className="stat-label">Links</span>
          </div>
        </button>
      </div>

      {/* Search & Subject Filter Bar */}
      <div className="materials-controls-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search materials..."
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

        <div className="subject-filter-tabs">
          {["All", "Mathematics", "Chemistry", "Physics"].map((subject) => {
            const isActive = selectedSubject === subject;
            return (
              <button
                key={subject}
                type="button"
                className={`subject-tab ${isActive ? "subject-tab-active" : ""}`}
                onClick={() => setSelectedSubject(subject)}
              >
                {subject}
              </button>
            );
          })}
        </div>
      </div>

      {/* Materials Cards Grid (2 Columns) */}
      <div className="materials-grid">
        {filteredMaterials.map((item) => {
          return (
            <article className="material-card" key={item.id}>
              <div className="material-card-top">
                {/* Type Icon */}
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
                  {item.type === "LINK" && <Link2 size={22} />}
                </div>

                {/* Meta details */}
                <div className="material-meta-info">
                  <div className="subject-badge-line">
                    <span
                      className={`subject-tag ${
                        item.subject === "Mathematics"
                          ? "subject-tag-math"
                          : item.subject === "Chemistry"
                          ? "subject-tag-chem"
                          : "subject-tag-phys"
                      }`}
                    >
                      {item.subject.toUpperCase()}
                    </span>
                    {item.isNew && <span className="new-badge">NEW</span>}
                  </div>
                  <span className="type-sublabel">{item.type}</span>
                </div>

                {/* Top Right Quick Action (only if item hasAction) */}
                {item.hasAction && (
                  <button
                    type="button"
                    className="quick-action-btn"
                    title={`Download ${item.title}`}
                    aria-label={`Download ${item.title}`}
                    onClick={() => handleDownload(item)}
                  >
                    <Download size={18} />
                  </button>
                )}
              </div>

              {/* Title and Instructor */}
              <div
                className="material-card-content"
                onClick={() => setPreviewMaterial(item)}
              >
                <h3 className="material-title">{item.title}</h3>
                <p className="material-teacher">{item.teacher}</p>
              </div>

              {/* Card Footer */}
              <div className="material-card-footer">
                <span className="material-date">{item.date}</span>
                <span className="material-size">{item.size}</span>
              </div>
            </article>
          );
        })}



        {filteredMaterials.length === 0 && (
          <div className="materials-empty-state">
            <FileCode size={40} className="empty-icon-art" />
            <h3>No materials found</h3>
            <p>Try adjusting your search query or subject filters.</p>
            <button
              type="button"
              className="reset-filters-btn"
              onClick={() => {
                setSearchQuery("");
                setSelectedSubject("All");
                setSelectedType("All");
              }}
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Download Notification Toast */}
      {downloadToast && (
        <div className="download-toast">
          <CheckCircle2 size={18} />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Resource Detail Modal */}
      {previewMaterial && (
        <div
          className="payment-modal-backdrop"
          onClick={() => setPreviewMaterial(null)}
        >
          <div
            className="payment-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-modal-head">
              <div>
                <h3>{previewMaterial.title}</h3>
                <p>
                  {previewMaterial.subject} • {previewMaterial.teacher}
                </p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setPreviewMaterial(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="payment-modal-body">
              <div className="material-preview-meta">
                <div>
                  <span>Type</span>
                  <strong>{previewMaterial.type}</strong>
                </div>
                <div>
                  <span>Uploaded</span>
                  <strong>{previewMaterial.date}</strong>
                </div>
                <div>
                  <span>Size</span>
                  <strong>{previewMaterial.size}</strong>
                </div>
              </div>

              <div className="material-desc-box">
                <p>{previewMaterial.description}</p>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="confirm-pay-btn"
                  onClick={() => {
                    handleDownload(previewMaterial);
                    setPreviewMaterial(null);
                  }}
                >
                  <Download size={18} style={{ marginRight: 8 }} />
                  {previewMaterial.type === "LINK"
                    ? "Open External Resource"
                    : `Download File (${previewMaterial.size})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
