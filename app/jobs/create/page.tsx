"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "../../../components/Icon";
import { SiteHeader } from "../../../components/SiteHeader";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/AuthProvider";
import { EmploymentType, WorkMode } from "../../../lib/job-samples";
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

  const needsAuth = !!supabase && authReady && !user;

  return <main className="jobs-page">
    <SiteHeader activePage="jobs" onLogin={() => router.push("/jobs")} />
    <div className="job-form-page">
      <div className="job-form-shell">
        <Link className="job-form-back" href="/jobs"><Icon name="arrow" />Ажлын жагсаалт руу буцах</Link>
        {!authReady ? null : needsAuth ? <section className="jobs-modal post-modal job-form-card auth-required-card">
          <p className="modal-kicker">Ажлын зар</p>
          <h2>Эхлээд нэвтэрнэ үү</h2>
          <p className="modal-subtitle">Ажлын зар нийтлэхийн тулд Project X бүртгэлдээ нэвтэрсэн байх шаардлагатай.</p>
          <Link className="modal-submit" href="/jobs">Ажлын жагсаалт руу очих <Icon name="arrow" /></Link>
        </section> : <section className="jobs-modal post-modal job-form-card">
          <p className="modal-kicker">Шинэ ажил</p>
          <h2>Ажлын зар байршуулах</h2>
          <p className="modal-subtitle">Бүтээлч мэргэжилтнүүдэд хүрэх ажлын зарыг дэлгэрэнгүй бичээрэй.</p>
          <form onSubmit={(event) => void submit(event)} className="post-form">
            <label>Ажлын гарчиг<input required value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} placeholder="Жишээ: UX/UI дизайнер" /></label>
            <label>Байгууллага<input required value={jobForm.company} onChange={(event) => setJobForm({ ...jobForm, company: event.target.value })} placeholder="Танай байгууллагын нэр" /></label>
            <div className="post-form-grid">
              <label>Байршил<input value={jobForm.location} onChange={(event) => setJobForm({ ...jobForm, location: event.target.value })} /></label>
              <label>Цалин / төсөв<input value={jobForm.salary} onChange={(event) => setJobForm({ ...jobForm, salary: event.target.value })} placeholder="₮4.0–6.0 сая / сар" /></label>
              <label>Ажлын төрөл<select value={jobForm.employmentType} onChange={(event) => setJobForm({ ...jobForm, employmentType: event.target.value as EmploymentType })}><option value="full_time">Бүтэн цаг</option><option value="freelance">Freelance</option><option value="contract">Гэрээт</option></select></label>
              <label>Ажиллах хэлбэр<select value={jobForm.workMode} onChange={(event) => setJobForm({ ...jobForm, workMode: event.target.value as WorkMode })}><option value="hybrid">Hybrid</option><option value="remote">Remote</option><option value="on_site">On-site</option></select></label>
            </div>
            <label>Тайлбар<textarea required value={jobForm.description} onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })} rows={4} placeholder="Энэ үүргийн зорилго, баг, сонирхолтой боломжийн тухай..." /></label>
            <label>Ур чадвар <span>(мөр тус бүрд нэг)</span><textarea value={jobForm.skills} onChange={(event) => setJobForm({ ...jobForm, skills: event.target.value })} rows={3} placeholder={"Figma\nUX Research\nDesign systems"} /></label>
            <label>Хийх ажил <span>(мөр тус бүрд нэг)</span><textarea value={jobForm.responsibilities} onChange={(event) => setJobForm({ ...jobForm, responsibilities: event.target.value })} rows={3} placeholder={"User flow боловсруулах\nDesign system өргөжүүлэх"} /></label>
            <label>Шаардлага <span>(мөр тус бүрд нэг)</span><textarea value={jobForm.requirements} onChange={(event) => setJobForm({ ...jobForm, requirements: event.target.value })} rows={3} placeholder={"2+ жилийн туршлагатай\nPortfolio илгээх"} /></label>
            {error && <p className="form-error">{error}</p>}
            <button className="modal-submit" disabled={busy} type="submit">{busy ? "Нийтэлж байна…" : "Ажлын зар нийтлэх"}<Icon name="arrow" /></button>
          </form>
        </section>}
      </div>
    </div>
  </main>;
}
