"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { Toast } from "../../../components/Toast";
import { AuthPageCard } from "../../../components/auth/AuthPageCard";
import { EmailField } from "../../../components/auth/AuthFields";
import { supabase } from "../../../lib/supabase";
import { sendPasswordResetLink } from "../../../lib/auth-actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3600); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const result = await sendPasswordResetLink(email);
    setBusy(false);
    notify(result.message);
    if (result.ok) setSentTo(email.trim());
  };

  return <main className="page-shell">
    <SiteHeader activePage="explore" onLogin={() => undefined} />
    <AuthPageCard title="Нууц үг сэргээх">
      {sentTo ? <>
        <p className="modal-subtitle">
          <strong>{sentTo}</strong> хаяг руу сэргээх холбоос илгээлээ. Ирсэн захидлаа шалгаад холбоос дээр дарна уу.
          Захидал 1–2 минутын дотор ирээгүй бол спам хавтсаа шалгаарай.
        </p>
        <div className="auth-page-actions">
          <button type="button" className="auth-submit" onClick={() => { setSentTo(""); }}>Өөр хаягаар дахин илгээх</button>
          <Link className="auth-switch" href="/">← Нүүр хуудас руу буцах</Link>
        </div>
      </> : <>
        <p className="modal-subtitle">Бүртгэлтэй имэйл хаягаа оруулна уу. Нууц үг сэргээх холбоосыг илгээнэ.</p>
        <form onSubmit={(event) => void submit(event)}>
          <EmailField value={email} onChange={setEmail} />
          <button className="auth-submit" disabled={busy} type="submit">{busy ? "Илгээж байна…" : "Сэргээх холбоос илгээх"}</button>
        </form>
        <div className="auth-page-actions">
          <Link className="auth-switch" href="/">← Нүүр хуудас руу буцах</Link>
        </div>
      </>}
    </AuthPageCard>
    <SiteFooter backendConnected={!!supabase} />
    <Toast message={toast} />
  </main>;
}
