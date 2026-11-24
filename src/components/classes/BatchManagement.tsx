"use client";
import { useState, type FormEvent } from "react";
import { fetchApi } from "@/lib/api";
import type { TeacherBatch } from "@/services/teacherService";

export function BatchManagement({ batch, subjects, onSaved }: { batch: TeacherBatch; subjects: {id:string;name:string}[]; onSaved: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name:batch.name,examYear:batch.examYear,subjectId:batch.subjectId,deliveryMode:batch.deliveryMode });
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    if (!form.name.trim() || !/^\d{4}$/.test(form.examYear) || !subjects.some(item=>item.id===form.subjectId)) { setError("Enter a class name, four-digit exam year and available subject."); return; }
    await mutate("PUT", `/batches/${batch.id}`, { ...form,name:form.name.trim() }, "Class details saved.");
  }
  async function mutate(method: string, path: string, body: object, success: string) {
    if (busy) return; setBusy(true); setError(""); setMessage("");
    try {
      await fetchApi(path, {method,body:JSON.stringify(body)});
      setEditing(false); setConfirm(false); setMessage(success);
      await onSaved();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not update this class. Retry or reload the page."); }
    finally { setBusy(false); }
  }
  const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
  return <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-label="Class management">
    <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-slate-900">Class settings</h2><span className={`text-xs font-bold ${batch.active ? "text-emerald-700" : "text-amber-800"}`}>{batch.active ? "Active" : "Archived"}</span></div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}{message && <p role="status" className="mt-3 text-sm text-emerald-800">{message}</p>}
    {editing ? <form onSubmit={save} className="mt-4"><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm">Class name<input required maxLength={255} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inputClass} /></label>
      <label className="text-sm">Exam year<input required pattern="[0-9]{4}" maxLength={4} inputMode="numeric" value={form.examYear} onChange={e=>setForm({...form,examYear:e.target.value})} className={inputClass} /></label>
      <label className="text-sm">Subject<select required value={form.subjectId} onChange={e=>setForm({...form,subjectId:e.target.value})} className={inputClass}><option value="">Select subject</option>{subjects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-sm">Delivery mode<select value={form.deliveryMode} onChange={e=>setForm({...form,deliveryMode:e.target.value})} className={inputClass}><option value="ONLINE">Online</option><option value="IN_PERSON">In person</option><option value="HYBRID">Hybrid</option></select></label>
      <div className="flex gap-3"><button disabled={busy} className="rounded-lg bg-emerald-700 text-white px-4 py-2 text-sm">{busy ? "Saving..." : "Save class"}</button><button type="button" disabled={busy} onClick={()=>setEditing(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></div>
    </fieldset></form> : <button disabled={busy} onClick={()=>{setForm({name:batch.name,examYear:batch.examYear,subjectId:batch.subjectId,deliveryMode:batch.deliveryMode});setEditing(true);setConfirm(false);}} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold">Edit class</button>}
    <div className="mt-5 border-t pt-4 text-sm"><p className="text-slate-600">{batch.active ? "Archive this class to hide it from discovery and pause student access. Existing enrollments, submissions and results are preserved." : "This class is archived. Restore it to make it discoverable and restore access for its approved students."}</p>
      {confirm ? <div className="mt-3 rounded-lg bg-amber-50 p-3"><p>Archive “{batch.name}” and pause student access?</p><div className="mt-3 flex gap-3"><button disabled={busy} onClick={()=>void mutate("PATCH",`/batches/${batch.id}/status`,{active:false},"Class archived. All existing work is preserved.")} className="rounded-lg bg-red-700 text-white px-4 py-2">Confirm archive</button><button disabled={busy} onClick={()=>setConfirm(false)} className="rounded-lg border px-4 py-2">Keep active</button></div></div> : <button disabled={busy || editing} onClick={()=>batch.active ? setConfirm(true) : void mutate("PATCH",`/batches/${batch.id}/status`,{active:true},"Class restored.")} className="mt-3 rounded-lg border px-4 py-2 font-semibold disabled:opacity-50">{busy ? "Updating..." : batch.active ? "Archive class" : "Restore class"}</button>}
    </div>
  </section>;
}
