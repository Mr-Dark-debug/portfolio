"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/studio/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Sign-in failed. Check your credentials.");
      }
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next?.startsWith("/studio") ? next : "/studio");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return <main className="studio-login-page"><section className="studio-login-card" aria-labelledby="studio-login-title"><div className="studio-login-brand"><span className="studio-brand-mark">PC</span><span className="studio-brand-copy"><strong>Prashant Portfolio Studio</strong><span>Private workspace</span></span></div><h1 id="studio-login-title">Welcome back.</h1><p>Sign in to compose, review, schedule, and publish Field Notes without touching the public site until you publish.</p><form className="studio-login-form" onSubmit={submit}><div className="studio-field"><label htmlFor="studio-username">Username</label><input className="studio-input" id="studio-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></div><div className="studio-field"><label htmlFor="studio-password">Password</label><input className="studio-input" id="studio-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>{error ? <p className="studio-login-error" role="alert">{error}</p> : null}<button className="studio-button studio-button-primary" type="submit" disabled={busy}>{busy ? "Checking…" : "Enter Studio"}<ArrowRight aria-hidden="true" /></button></form><div className="studio-login-foot"><span><LockKeyhole aria-hidden="true" /> HttpOnly session</span><span><ShieldCheck aria-hidden="true" /> Server verified</span></div></section></main>;
}
