"use client";

import { AlertCircle, Check, CheckCircle2, ClipboardCheck, LoaderCircle, RefreshCw, Search, Users, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTeacherEnrollmentRequests, setStudentClassAccess, type StudentAccessRequest } from "@/services/teacherService";

type AccessFilter = "all" | "pending" | "allowed" | "denied";
const accessFilters: { value: AccessFilter; label: string }[] = [
  { value: "all", label: "All students" },
  { value: "pending", label: "Pending" },
  { value: "allowed", label: "Allowed" },
  { value: "denied", label: "Denied" },
];

function accessStatus(request: StudentAccessRequest): Exclude<AccessFilter, "all"> {
  if (request.accessGranted) return "allowed";
  return request.status === "PENDING" ? "pending" : "denied";
}

function requestedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function TeacherEnrollmentsPage() {
  const [requests, setRequests] = useState<StudentAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("pending");
  const [processing, setProcessing] = useState<{ id: string; allowed: boolean } | null>(null);
  const mounted = useRef(false);
  const mutationRunning = useRef(false);
  const requestVersion = useRef(0);
  const listRequest = useRef<AbortController | null>(null);

  const loadRequests = useCallback(async () => {
    if (!mounted.current || mutationRunning.current) return;
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadError("");
    setActionError("");
    try {
      const response = await getTeacherEnrollmentRequests(controller.signal);
      if (!mounted.current || controller.signal.aborted || version !== requestVersion.current) return;
      setRequests(response);
    } catch (error) {
      if (mounted.current && !controller.signal.aborted && version === requestVersion.current) {
        setLoadError(error instanceof Error ? error.message : "Could not load enrollment requests. Please try again.");
      }
    } finally {
      if (listRequest.current === controller) listRequest.current = null;
      if (mounted.current && version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    void Promise.resolve().then(() => { if (active) void loadRequests(); });
    return () => {
      active = false;
      mounted.current = false;
      listRequest.current?.abort();
    };
  }, [loadRequests]);

  const batches = useMemo(() => Array.from(new Map(requests.map((request) => [request.batchId, {
    id: request.batchId, name: request.batchName || "Class",
  }])).values()).sort((first, second) => first.name.localeCompare(second.name)), [requests]);
  const selectedBatch = batches.some((batch) => batch.id === batchFilter) ? batchFilter : "all";
  const accessCounts = useMemo(() => requests.reduce((counts, request) => {
    counts[accessStatus(request)]++;
    return counts;
  }, { all: requests.length, pending: 0, allowed: 0, denied: 0 }), [requests]);
  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => (accessFilter === "all" || accessStatus(request) === accessFilter)
      && (selectedBatch === "all" || request.batchId === selectedBatch)
      && [request.studentName, request.studentNumber, request.batchName, request.subject].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [requests, search, selectedBatch, accessFilter]);

  async function decide(request: StudentAccessRequest, allowed: boolean) {
    if (mutationRunning.current || loading || loadError || !mounted.current) return;
    mutationRunning.current = true;
    requestVersion.current++;
    listRequest.current?.abort();
    setProcessing({ id: request.id, allowed });
    setActionError("");
    setSuccess("");
    try {
      const response = await setStudentClassAccess(request.id, allowed);
      if (!mounted.current) return;
      setRequests((previous) => previous.map((item) => item.studentId === request.studentId && item.batchId === request.batchId ? {
        ...item, accessGranted: response.accessGranted, status: response.status ?? (response.accessGranted ? "APPROVED" : "REJECTED"),
      } : item));
      setSuccess(`${response.accessGranted ? "Class access allowed" : "Class access denied"} for ${request.studentName || "the student"}.`);
    } catch (error) {
      if (mounted.current) setActionError(error instanceof Error ? error.message : "Could not update this request. Please try again.");
    } finally {
      mutationRunning.current = false;
      if (mounted.current) setProcessing(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Manage your classes</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 font-serif">Student class access</h1>
          <p className="text-sm text-gray-500 mt-2">Allow or deny access to your classes. You can change a student&apos;s access at any time.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/teacher/classes" className="text-sm font-semibold text-emerald-700 hover:underline">My classes</Link>
          <button type="button" disabled={loading || !!processing} onClick={() => void loadRequests()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh requests
          </button>
        </div>
      </div>

      {success && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={18} className="shrink-0" />{success}</div>}
      {actionError && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span className="flex items-start gap-2"><AlertCircle size={18} className="shrink-0" />{actionError}</span><button type="button" onClick={() => void loadRequests()} className="shrink-0 font-semibold underline">Refresh requests</button></div>}

      <section aria-label="Student class access" className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-amber-50 text-amber-700"><ClipboardCheck size={21} /></span>
            <div><h2 className="font-bold text-gray-900">Class access requests</h2><p className="text-xs text-gray-500">{loading ? "Loading requests..." : loadError ? "Requests unavailable" : `${accessCounts.pending} pending · ${accessCounts.allowed} allowed · ${accessCounts.denied} denied`}</p></div>
          </div>
          <div className="flex flex-wrap items-end gap-3 w-full lg:w-auto">
            <label className="flex-1 min-w-48 lg:w-64"><span className="block text-xs font-medium text-gray-500 mb-1">Search requests</span><span className="relative block"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Student, student ID or class..." className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" /></span></label>
            <label className="flex-1 min-w-40 lg:w-48"><span className="block text-xs font-medium text-gray-500 mb-1">Class</span><select value={selectedBatch} onChange={(event) => setBatchFilter(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"><option value="all">All classes</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
          </div>
        </div>

        <div role="group" aria-label="Filter by class access" className="flex flex-wrap gap-2 border-b border-gray-100 px-5 py-3">
          {accessFilters.map((filter) => <button key={filter.value} type="button" aria-pressed={accessFilter === filter.value}
            onClick={() => setAccessFilter(filter.value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${accessFilter === filter.value ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {filter.label}<span className="ml-2 rounded-md bg-white/70 px-1.5 py-0.5">{loading || loadError ? "—" : accessCounts[filter.value]}</span>
          </button>)}
        </div>

        {loading ? <div role="status" className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500"><LoaderCircle size={20} className="animate-spin" />Loading enrollment requests...</div>
          : loadError ? <div role="alert" className="p-12 text-center"><AlertCircle size={28} className="mx-auto mb-3 text-red-500" /><p className="text-sm text-red-700">{loadError}</p><button type="button" onClick={() => void loadRequests()} className="mt-4 text-sm font-semibold text-emerald-700 underline">Try again</button></div>
            : visibleRequests.length === 0 ? <div className="p-12 text-center"><Users size={30} className="mx-auto mb-3 text-gray-400" /><h3 className="font-semibold text-gray-900">{requests.length === 0 ? "No enrollment requests yet" : accessFilter === "pending" && !search.trim() && selectedBatch === "all" ? "No pending enrollment requests" : "No matching students"}</h3><p className="mt-2 text-sm text-gray-500">{requests.length === 0 ? "New student requests for your classes will appear here." : "Try a different search, class or access filter."}</p>{requests.length > 0 && <button type="button" onClick={() => { setSearch(""); setBatchFilter("all"); setAccessFilter("all"); }} className="mt-4 text-sm font-semibold text-emerald-700 underline">Show all students</button>}</div>
              : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm text-left"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th scope="col" className="px-5 py-3 font-semibold">Student</th><th scope="col" className="px-5 py-3 font-semibold">Class</th><th scope="col" className="px-5 py-3 font-semibold">Requested</th><th scope="col" className="px-5 py-3 font-semibold">Access</th><th scope="col" className="px-5 py-3 font-semibold text-right">Manage access</th></tr></thead><tbody className="divide-y divide-gray-100">{visibleRequests.map((request) => <tr key={request.id}>
                <td className="px-5 py-4"><p className="font-semibold text-gray-900">{request.studentName || "Student"}</p><p className="text-xs text-gray-500 mt-1">{request.studentNumber || "Student ID unavailable"}</p></td>
                <td className="px-5 py-4"><Link href={`/teacher/classes/${encodeURIComponent(request.batchId)}`} className="font-semibold text-gray-800 hover:text-emerald-700 hover:underline">{request.batchName || "View class"}</Link>{request.subject && <p className="text-xs text-gray-500 mt-1">{request.subject}</p>}{request.batchActive === false && <p className="text-xs text-amber-700 mt-1">Class inactive. Activate the class to allow access.</p>}</td>
                <td className="px-5 py-4 text-gray-500"><time dateTime={request.createdAt}>{requestedAt(request.createdAt)}</time></td>
                <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${accessStatus(request) === "allowed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : accessStatus(request) === "pending" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700"}`}>{request.batchActive === false ? "Class inactive" : accessStatus(request) === "allowed" ? "Allowed" : accessStatus(request) === "pending" ? "Pending review" : "Denied"}</span></td>
                <td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><button type="button" disabled={!!processing || request.accessGranted || request.batchActive === false} aria-label={`Allow access for ${request.studentName || "student"}`} onClick={() => void decide(request, true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50">{processing?.id === request.id && processing.allowed ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}Allow access</button><button type="button" disabled={!!processing || (request.status === "REJECTED" && !request.accessGranted)} aria-label={`Deny access for ${request.studentName || "student"}`} onClick={() => void decide(request, false)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50">{processing?.id === request.id && !processing.allowed ? <LoaderCircle size={15} className="animate-spin" /> : <X size={15} />}Deny access</button></div></td>
              </tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
