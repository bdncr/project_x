"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { Toast } from "../../../components/Toast";
import Link from "next/link";
import { AuthPageCard } from "../../../components/auth/AuthPageCard";
import { PasswordField } from "../../../components/auth/AuthFields";
import { supabase } from "../../../lib/supabase";

/** "checking" while we work out whether the link carried a valid recovery token,
 * "ready" once Supabase has a recovery session, "invalid" for an expired/absent link. */
type ResetStage = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<ResetStage>("checking");
  const [problem, setProblem] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    if (!supabase) { setStage("invalid"); setProblem("Backend тохируулаагүй байна."); return; }
    const client = supabase;

    // Supabase reports a dead link in the hash rather than by failing the redirect, so
    // an expired token arrives here looking like a normal page load.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashError = hash.get("error_description") ?? hash.get("error");
    if (hashError) { setStage("invalid"); setProblem(hashError); return; }

    async function resolveRecoverySession() {
      // PKCE links arrive as ?code=...; implicit links put the token in the hash, which
      // the client already consumed via detectSessionInUrl before this effect ran.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (error) { setStage("invalid"); setProblem(error.message); return; }
      }
      const { data } = await client.auth.getSession();
      if (data.session) { setStage("ready"); return; }
      setStage("invalid");
      setProblem("Холбоос хүчингүй эсвэл хугацаа нь дууссан байна.");
    }

    // A recovery token may still be mid-exchange when this mounts, so take whichever
    // resolves first: the PASSWORD_RECOVERY event or our own session lookup.
    const { data: listener } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setStage("ready");
    });
    void resolveRecoverySession();
    return () => listener.subscription.unsubscribe();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    if (password !== confirmPassword) { notify("Хоёр нууц үг таарахгүй байна."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { notify(error.message); return; }
    setStage("done");
    notify("Нууц үг шинэчлэгдлээ.");
    window.setTimeout(() => router.push("/"), 1500);
  };

  return <main className="page-shell">
    <SiteHeader activePage="explore" onLogin={() => router.push("/")} />
    <AuthPageCard title="Шинэ нууц үг">

      {stage === "checking" && <p className="modal-subtitle">Холбоосыг шалгаж байна…</p>}

      {stage === "invalid" && <>
        <p className="modal-subtitle">{problem}</p>
        <div className="auth-page-actions">
          {/* A dead link is nearly always an expired one, so the useful next step is a
              fresh link rather than being dropped back on the home page. */}
          <Link className="auth-submit" href="/auth/forgot">Шинэ холбоос авах</Link>
          <Link className="auth-switch" href="/">← Нүүр хуудас руу буцах</Link>
        </div>
      </>}

      {stage === "ready" && <>
        <p className="modal-subtitle">Шинэ нууц үгээ хоёр удаа оруулна уу.</p>
        <form onSubmit={(event) => void submit(event)}>
          <PasswordField value={password} onChange={setPassword} />
          <label>Нууц үг давтах<input required type="password" minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          <button className="auth-submit" disabled={busy} type="submit">{busy ? "Хадгалж байна…" : "Нууц үг шинэчлэх"}</button>
        </form>
      </>}

      {stage === "done" && <p className="modal-subtitle">Нууц үг амжилттай шинэчлэгдлээ. Нүүр хуудас руу шилжиж байна…</p>}
    </AuthPageCard>
    <SiteFooter backendConnected={!!supabase} />
    <Toast message={toast} />
  </main>;
}
