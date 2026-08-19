"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "../../../components/Icon";
import { SiteHeader } from "../../../components/SiteHeader";
import { AuthDialog, AuthMode } from "../../../components/AuthDialog";
import { Toast } from "../../../components/Toast";
import { PostJobForm } from "../../../components/jobs/PostJobForm";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/AuthProvider";
import { JobForm, emptyJobForm, addLocalJob, buildJobInsertPayload, buildLocalJob, randomCompanyColor } from "../../../lib/jobs-data";

const PREFILL_KEY = "project-x-hire-prompt";

function deriveTitle(prompt: string) {
  const firstLine = prompt.split(/[\n.]/)[0].trim();
  return (firstLine.length > 2 ? firstLine : prompt).slice(0, 80);
}

export default function CreateJobPage() {
  const router = useRouter();
  const { user, authReady } = useAuth();
  const [jobForm, setJobForm] = useState<JobForm>(emptyJobForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [toast, setToast] = useState("");

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3400); };

  useEffect(() => {
    const prompt = window.sessionStorage.getItem(PREFILL_KEY);
    if (!prompt) return;
    window.sessionStorage.removeItem(PREFILL_KEY);
    setJobForm((current) => ({ ...current, title: current.title || deriveTitle(prompt), description: current.description || prompt }));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!jobForm.title.trim() || !jobForm.company.trim() || !jobForm.description.trim()) {
      setError("Гарчиг, байгууллага, тайлбарыг бөглөнө үү.");
      return;
    }
    setBusy(true);
    const companyColor = randomCompanyColor();
    if (supabase && user) {
      const hiringContact = user.user_metadata.display_name || user.email?.split("@")[0] || jobForm.company.trim();
      const payload = buildJobInsertPayload(jobForm, companyColor, hiringContact);
      const { error: insertError } = await supabase.from("job_posts").insert({ ...payload, owner_id: user.id });
      setBusy(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      router.push("/jobs");
      return;
    }
    addLocalJob(buildLocalJob(jobForm, companyColor, jobForm.company.trim()));
    setBusy(false);
    router.push("/jobs");
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setAuthBusy(true);
    const response = authMode === "signin"
      ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      : await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { display_name: authName.trim() } } });
    setAuthBusy(false);
    if (response.error) { notify(response.error.message); return; }
    if (authMode === "signup" && !response.data.session) { notify("Баталгаажуулах имэйлээ шалгаад нэвтэрнэ үү."); return; }
    setAuthOpen(false);
    setAuthPassword("");
    notify(authMode === "signin" ? "Амжилттай нэвтэрлээ." : "Бүртгэл амжилттай үүслээ.");
  }

  const needsAuth = !!supabase && authReady && !user;

  return <main className="jobs-page">
    <SiteHeader activePage="jobs" onLogin={() => setAuthOpen(true)} />
    <div className="job-form-page">
      <div className="job-form-shell">
        <Link className="job-form-back" href="/jobs"><Icon name="arrow" />Ажлын жагсаалт руу буцах</Link>
        {!authReady ? null : needsAuth ? <section className="jobs-modal post-modal job-form-card auth-required-card">
          <p className="modal-kicker">Ажлын зар</p>
          <h2>Эхлээд нэвтэрнэ үү</h2>
          <p className="modal-subtitle">Ажлын зар нийтлэхийн тулд Project X бүртгэлдээ нэвтэрсэн байх шаардлагатай.</p>
          <button type="button" className="modal-submit" onClick={() => setAuthOpen(true)}>Нэвтрэх <Icon name="arrow" /></button>
        </section> : <PostJobForm form={jobForm} onFormChange={setJobForm} onSubmit={(event) => void submit(event)} busy={busy} error={error} />}
      </div>
    </div>
    {authOpen && <AuthDialog
      variant="jobs"
      mode={authMode} onModeChange={setAuthMode}
      name={authName} onNameChange={setAuthName}
      email={authEmail} onEmailChange={setAuthEmail}
      password={authPassword} onPasswordChange={setAuthPassword}
      busy={authBusy}
      subtitle="Ажлын зар нийтлэхийн тулд нэвтэрнэ үү."
      onClose={() => setAuthOpen(false)} onSubmit={(event) => void submitAuth(event)}
    />}
    <Toast message={toast} className="jobs-toast" />
  </main>;
}
