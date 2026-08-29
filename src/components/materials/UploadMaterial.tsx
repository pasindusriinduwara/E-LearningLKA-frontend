"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";
import {
  getTeacherBatches,
  uploadTeacherMaterial,
  type TeacherBatch,
} from "@/services/teacherService";

interface UploadMaterialFormProps {
  onCancel: () => void;
  onUploaded?: () => void;
}

export function UploadMaterialForm({ onCancel, onUploaded }: UploadMaterialFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [batches, setBatches] = useState<TeacherBatch[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [batchId, setBatchId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getTeacherBatches()
      .then((result) => {
        if (!active) return;
        setBatches(result);
        if (result.length > 0) setBatchId(result[0].id);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load your batches");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleFileChange(nextFile: File | undefined) {
    setError(null);
    setSuccess(null);
    if (!nextFile) {
      setFile(null);
      return;
    }
    if (nextFile.size > 20 * 1024 * 1024) {
      setFile(null);
      setError("File must be 20 MB or smaller");
      return;
    }
    setFile(nextFile);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!batchId) return setError("Select a batch first");
    if (!title.trim()) return setError("Enter a material title");
    if (!file) return setError("Choose a file to upload");

    setSubmitting(true);
    try {
      await uploadTeacherMaterial({ batchId, title: title.trim(), subject: subject.trim(), file });
      setSuccess("Material uploaded successfully");
      setTitle("");
      setSubject("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploaded?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Material upload failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
      <h2 className="text-xl font-extrabold text-gray-900 font-serif mb-6">Upload new material</h2>

      {error && <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="material-title" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Title</label>
          <input id="material-title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Integration Notes Ch. 5" disabled={submitting} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900" />
        </div>
        <div>
          <label htmlFor="material-subject" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Subject</label>
          <input id="material-subject" type="text" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Pure Mathematics" disabled={submitting} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900" />
        </div>
        <div>
          <label htmlFor="material-batch" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Batch</label>
          <select id="material-batch" value={batchId} onChange={(event) => setBatchId(event.target.value)} disabled={loading || submitting || batches.length === 0} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm text-gray-900">
            {batches.length === 0 ? <option value="">No batches available</option> : batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
          </select>
        </div>
      </div>

      <input ref={fileInputRef} id="material-file" type="file" accept=".pdf,.mp4,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx" className="sr-only" onChange={(event) => handleFileChange(event.target.files?.[0])} disabled={submitting} />
      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={submitting} className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center mb-8 cursor-pointer hover:bg-gray-50 hover:border-emerald-500/30 transition-all group">
        <div className="w-12 h-12 bg-emerald-50 text-[#2D9F75] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><UploadCloud size={22} strokeWidth={2.5} /></div>
        <p className="text-sm font-bold text-gray-700 mb-1">{file ? file.name : "Drop file here or click to browse"}</p>
        <p className="text-xs text-gray-400">PDF, MP4, PNG, JPG, DOC, or PPT up to 20 MB</p>
      </button>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={submitting} className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
        <button type="submit" disabled={submitting || loading || batches.length === 0} className="px-6 py-2.5 text-sm font-semibold text-white bg-[#2D9F75] hover:bg-emerald-600 disabled:opacity-50 rounded-xl transition-colors shadow-sm flex items-center gap-2">
          <FileText size={16} /> {submitting ? "Uploading..." : "Upload"}
        </button>
      </div>
    </form>
  );
}
