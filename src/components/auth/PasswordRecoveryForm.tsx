"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";

const subscribeToHash = (listener: () => void) => { window.addEventListener("hashchange", listener); return () => window.removeEventListener("hashchange", listener); };
const readResetToken = () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
const serverToken = () => null;

export function PasswordRecoveryForm({ reset = false }: { reset?: boolean }) {
  const [email, setEmail] = useState("");
  const token = useSyncExternalStore(subscribeToHash, readResetToken, serverToken);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (reset && (password !== confirmation || password.length < 8 || new TextEncoder().encode(password).length > 72)) {
      setError("Use matching passwords with at least 8 characters and at most 72 UTF-8 bytes."); return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${reset ? "reset-password" : "forgot-password"}`, {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reset ? { token, password } : { email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not complete the request. Please retry.");
      if (reset) window.history.replaceState(null, "", window.location.pathname);
      setMessage(data.message); setPassword(""); setConfirmation("");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Please try again."); }
    finally { setBusy(false); }
  }
  const invalidLink = reset && token === "";
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{reset ? "Reset password" : "Forgot password?"}</h1>
        <p className="mt-3 text-sm text-slate-600">{reset ? "Choose a new password. You will sign in again on your devices." : "Enter your account email. We will send a link that expires in 30 minutes."}</p>
        {message ? <p role="status" className="my-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p> : invalidLink ? <p role="alert" className="my-5 text-sm text-red-700">This reset link is missing its token. <Link href="/forgot-password" className="underline">Request a new link</Link>.</p> : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {reset ? <>
              <label className="block text-sm font-medium">New password<input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
              <label className="block text-sm font-medium">Confirm new password<input name="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
            </> : <label className="block text-sm font-medium">Email address<input name="email" type="email" autoComplete="email" required maxLength={150} value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={busy || (reset && token === null)} className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Please wait..." : reset ? "Reset password" : "Send reset link"}</button>
          </form>
        )}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-indigo-700 underline">Back to sign in</Link>
      </section>
    </main>
  );
}
