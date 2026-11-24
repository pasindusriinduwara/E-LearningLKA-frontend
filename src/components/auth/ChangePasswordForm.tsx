"use client";
import { useState, type FormEvent } from "react";
import { fetchApi } from "@/lib/api";

export function ChangePasswordForm() {
  const [currentPassword, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setError("");
    if (password !== confirmation || password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setError("Use matching passwords with at least 8 characters and at most 72 UTF-8 bytes."); return;
    }
    setBusy(true);
    try {
      await fetchApi("/account/password", { method: "POST", body: JSON.stringify({ currentPassword, password }) });
      setDone(true); setCurrent(""); setPassword(""); setConfirmation("");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not change password."); }
    finally { setBusy(false); }
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 mt-6">
    <h2 className="text-lg font-bold text-slate-900">Change password</h2>
    <p className="my-2 text-sm text-slate-600">Changing your password signs you out on all devices.</p>
    {done ? <p role="status" className="text-emerald-800">Password changed. <a href="/login" className="underline font-semibold">Sign in again</a>.</p> : <form onSubmit={submit} className="max-w-md space-y-3 mt-4">
      <label className="block text-sm font-medium">Current password<input type="password" name="currentPassword" required autoComplete="current-password" value={currentPassword} onChange={e=>setCurrent(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label>
      <label className="block text-sm font-medium">New password<input type="password" name="newPassword" required autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label>
      <label className="block text-sm font-medium">Confirm password<input type="password" name="confirmPassword" required autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-sm text-white disabled:opacity-60">{busy ? "Changing..." : "Change password"}</button>
    </form>}
  </section>;
}
