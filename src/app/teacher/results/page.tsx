"use client";

import { ConfirmModal } from "@/components/common/ConfirmModal";
import { TeacherGradingModal } from "@/components/assignments/TeacherGradingModal";
import { ResultStats } from "@/components/results/ResultStats";
import { ResultsTable } from "@/components/results/ResultsTable";
import type { Submission } from "@/lib/types/assignment";
import type { TeacherResultDetail, TeacherResultSummary } from "@/lib/types/results";
import { resultService } from "@/services/resultService";
import { AlertCircle, BookOpen, CheckCircle2, EyeOff, Loader2, RefreshCw, Send, Trophy } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const button = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const select = "mt-2 block w-full rounded-xl border border-gray-200 bg-white p-3 text-sm font-medium text-gray-900";

export default function ResultsPage() {
  const [assessments, setAssessments] = useState<TeacherResultSummary[]>([]);
  const [batchId, setBatchId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const load = useCallback(() => {
    const current = ++request.current;
    return resultService.list().then((data) => {
      if (current !== request.current) return;
      setAssessments(data); setError(null);
    }).catch((err: unknown) => {
      if (current === request.current) setError(err instanceof Error ? err.message : "Could not load results");
    }).finally(() => { if (current === request.current) setLoading(false); });
  }, []);
  const invalidate = useCallback(() => { request.current++; }, []);
  useEffect(() => { void load(); return invalidate; }, [load, invalidate]);
  const batches = Array.from(new Map(assessments.map((a) => [a.batchId, a.batchName])).entries());
  const filtered = assessments.filter((a) => !batchId || a.batchId === batchId);
  const selected = filtered.find((a) => a.id === selectedId) || filtered[0];

  return <div className="max-w-7xl mx-auto space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Academic performance</p><h1 className="text-4xl font-extrabold text-gray-900 font-serif">Results</h1><p className="mt-2 text-sm text-gray-500">Review assessment marks, then publish each student&apos;s result to their portal.</p></div>
      <button type="button" disabled={loading} onClick={() => { setLoading(true); void load(); }} className={`${button} border border-gray-200 bg-white text-gray-700`}><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh</button>
    </header>
    {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle size={18} />{error}</div>}
    {loading ? <div role="status" className="rounded-2xl border border-gray-200 bg-white p-16 text-center text-gray-500"><Loader2 className="mx-auto mb-3 animate-spin text-emerald-600" />Loading assessments…</div>
      : assessments.length === 0 && !error ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-14 text-center"><BookOpen className="mx-auto mb-4 text-emerald-600" size={36} /><h2 className="text-lg font-bold text-gray-900">No assessments yet</h2><p className="mt-2 text-sm text-gray-500">Create an assessment and collect student submissions to publish results.</p><Link href="/teacher/assignments" className={`mt-5 ${button} bg-emerald-600 text-white`}>Go to assessments</Link></div>
      : !error && <>
        <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2">
          <label className="text-xs font-bold text-gray-500">Batch<select value={batchId} onChange={(e) => { setBatchId(e.target.value); setSelectedId(""); }} className={select}><option value="">All batches</option>{batches.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label className="text-xs font-bold text-gray-500">Assessment<select value={selected?.id || ""} onChange={(e) => setSelectedId(e.target.value)} className={select}>{filtered.map((a) => <option key={a.id} value={a.id}>{a.title} — {a.batchName}</option>)}</select></label>
        </section>
        {selected ? <AssessmentResults key={selected.id} id={selected.id} onChange={(updated) => setAssessments((all) => all.map((a) => a.id === updated.id ? updated : a))} /> : <p className="text-sm text-gray-500">No assessments in this batch.</p>}
      </>}
  </div>;
}

function AssessmentResults({ id, onChange }: { id: string; onChange: (summary: TeacherResultSummary) => void }) {
  const [detail, setDetail] = useState<TeacherResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  const [busy, setBusy] = useState(false);
  const [grading, setGrading] = useState<Submission | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All submissions");
  const request = useRef(0);
  const load = useCallback(() => {
    const current = ++request.current;
    return resultService.get(id).then((data) => { if (current === request.current) { setDetail(data); setError(null); } })
      .catch((err: unknown) => { if (current === request.current) setError(err instanceof Error ? err.message : "Could not load assessment results"); })
      .finally(() => { if (current === request.current) setLoading(false); });
  }, [id]);
  const invalidate = useCallback(() => { request.current++; }, []);
  useEffect(() => { void load(); return invalidate; }, [load, invalidate]);

  async function changePublication() {
    if (!confirm) return;
    const action = confirm;
    setBusy(true); setError(null); setNotice(null);
    try {
      const data = await resultService[action](id);
      setDetail(data); onChange(data.assessment); setConfirm(null);
      setNotice(action === "publish" ? "Results published. Each student can now see their own released marks and feedback." : "Results unpublished. Marks and feedback are private again.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update publication"); setConfirm(null); }
    finally { setBusy(false); }
  }

  if (loading) return <div role="status" className="py-16 text-center text-gray-500"><Loader2 className="mx-auto mb-3 animate-spin text-emerald-600" />Loading student results…</div>;
  if (!detail) return <div role="alert" className="rounded-xl bg-rose-50 p-5 text-sm text-rose-700">{error || "Could not load results."}<button className="ml-3 font-bold underline" onClick={() => { setLoading(true); void load(); }}>Retry</button></div>;
  const a = detail.assessment;
  const ready = a.gradedCount - a.publishedCount;
  const pending = a.submittedCount - a.gradedCount;
  const rows = detail.submissions.filter((s) => `${s.studentName} ${s.studentId}`.toLowerCase().includes(search.toLowerCase())
    && (filter === "All submissions" || (filter === "Published" ? s.resultPublished : filter === "Ready to publish" ? s.status === "Graded" && !s.resultPublished : s.status !== "Graded")));

  return <>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} />{notice}</p>}
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600">{a.assessmentType === "MCQ_QUIZ" ? "MCQ Quiz" : "Assignment"}</span><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${a.publishedCount ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{a.publishedCount === 0 ? "Not published" : ready > 0 ? "Partially published" : "Published"}</span></div>
          <h2 className="text-xl font-extrabold text-gray-900">{a.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{a.batchName} · {a.totalMarks} total marks · {a.submittedCount} / {a.enrolledCount} students submitted</p>
          {a.lastPublishedAt && <p className="mt-2 text-xs text-gray-400">Last published {new Date(a.lastPublishedAt).toLocaleString("en-GB")}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {a.publishedCount > 0 && <button type="button" disabled={busy} onClick={() => setConfirm("unpublish")} className={`${button} border border-gray-200 text-gray-600`}><EyeOff size={16} />Unpublish</button>}
          <button type="button" disabled={busy || ready <= 0} onClick={() => setConfirm("publish")} className={`${button} bg-[#2D9F75] text-white hover:bg-emerald-600`}><Send size={16} />{ready > 0 ? `Publish ${ready} result${ready === 1 ? "" : "s"}` : a.publishedCount ? "All graded results published" : "Publish results"}</button>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500"><span><strong className="text-emerald-700">{a.publishedCount}</strong> published</span><span><strong className="text-amber-600">{ready}</strong> ready to publish</span><span><strong className="text-gray-800">{pending}</strong> awaiting grading</span></div>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">Only graded submissions are released. Each student sees their own result. Saving a revised grade makes that result private until you publish it again.</p>
    </section>
    <ResultStats stats={{ classAverage: a.average === null ? "—" : `${a.average}/${a.totalMarks}`, highestScore: a.highest === null ? "—" : `${a.highest}/${a.totalMarks}`, passRate: a.passRate === null ? "—" : `${a.passRate}%`, studentsRanked: a.gradedCount }} />
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h3 className="flex items-center gap-2 text-base font-bold text-gray-900"><Trophy size={18} className="text-emerald-600" />Student results</h3><div className="flex flex-col gap-2 sm:flex-row"><input aria-label="Search students" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student name or ID" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm" /><select aria-label="Filter publication status" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm">{["All submissions", "Ready to publish", "Published", "Awaiting grading"].map((s) => <option key={s}>{s}</option>)}</select></div></div>
      <ResultsTable results={rows} onGrade={setGrading} disabled={busy} />
      <p className="text-xs text-gray-400">Rank and statistics use graded submissions only. Equal marks share a rank. Pass rate uses a 40% pass mark.</p>
    </section>
    <ConfirmModal isOpen={confirm !== null} title={confirm === "publish" ? "Publish assessment results?" : "Unpublish assessment results?"} description={confirm === "publish" ? `Release ${ready} graded result${ready === 1 ? "" : "s"} to the relevant students. ${pending} ungraded submission${pending === 1 ? " remains" : "s remain"} private.` : "Hide all released marks, grades, feedback and answer reviews for this assessment. Saved grades will be retained."} confirmText={confirm === "publish" ? "Publish results" : "Unpublish results"} isDestructive={confirm === "unpublish"} isLoading={busy} onConfirm={() => void changePublication()} onClose={() => { if (!busy) setConfirm(null); }} />
    {grading && <TeacherGradingModal assessmentId={id} totalMarks={a.totalMarks} submission={grading} onClose={() => setGrading(null)} onGraded={() => {
      setBusy(true);
      setNotice("Grade saved privately. Publish it when you are ready to release it.");
      void resultService.get(id).then((data) => { setDetail(data); setError(null); onChange(data.assessment); }).catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not refresh grades")).finally(() => setBusy(false));
    }} />}
  </>;
}
