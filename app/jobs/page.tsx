"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { Icon as SharedIcon } from "../../components/Icon";
import { SiteHeader } from "../../components/SiteHeader";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthProvider";
import { Job, EmploymentType, SAMPLE_JOBS, WorkMode } from "../../lib/job-samples";
import { DatabaseJobRow, loadLocalJobs, mapJob } from "../../lib/jobs-data";

type JobsTab = "for_you" | "freelance" | "full_time" | "saved" | "applied";
type AuthMode = "signin" | "signup";

const Icon = SharedIcon;

function demoJobs() {
  return [...loadLocalJobs(), ...SAMPLE_JOBS];
}

function friendlyType(type: EmploymentType) {
  return type === "full_time" ? "Бүтэн цаг" : type === "freelance" ? "Freelance" : "Гэрээт";
}

function friendlyMode(mode: WorkMode) {
  return mode === "remote" ? "Remote" : mode === "hybrid" ? "Hybrid" : "On-site";
}

function relativeDate(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const hours = Math.floor(elapsed / 3600000);
  if (hours < 1) return "Саяхан";
  if (hours < 24) return String(hours) + " цагийн өмнө";
  const days = Math.floor(hours / 24);
  if (days < 7) return String(days) + " өдрийн өмнө";
  return String(Math.floor(days / 7)) + " долоо хоногийн өмнө";
}

function demoState(key: "saved" | "applied") {
  if (typeof window === "undefined") return [] as string[];
  try {
    const value = JSON.parse(window.localStorage.getItem("project-x-jobs-" + key) || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [] as string[];
  }
}

function persistDemoState(key: "saved" | "applied", value: string[]) {
  window.localStorage.setItem("project-x-jobs-" + key, JSON.stringify(value));
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(() => (supabase ? [] : demoJobs()));
  const [selectedId, setSelectedId] = useState(() => (supabase ? "" : demoJobs()[0].id));
  const [tab, setTab] = useState<JobsTab>("for_you");
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState<"all" | WorkMode>("all");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const { user, authReady } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataMode, setDataMode] = useState<"backend" | "demo">("demo");
  const [toast, setToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [applicationStep, setApplicationStep] = useState<"location" | "form">("form");
  const [coverLetter, setCoverLetter] = useState("");
  const [choiceOpen, setChoiceOpen] = useState(false);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3400);
  }

  async function loadJobs(activeUser: User | null) {
    setLoading(true);
    if (!supabase) {
      const jobList = demoJobs();
      setJobs(jobList);
      setSelectedId((current) => jobList.some((job) => job.id === current) ? current : jobList[0].id);
      setSavedIds(demoState("saved"));
      setAppliedIds(demoState("applied"));
      setDataMode("demo");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("job_posts").select("*").eq("status", "active").order("published_at", { ascending: false });
    if (error || !data || data.length === 0) {
      const jobList = demoJobs();
      setJobs(jobList);
      setSelectedId((current) => jobList.some((job) => job.id === current) ? current : jobList[0].id);
      setSavedIds(demoState("saved"));
      setAppliedIds(demoState("applied"));
      setDataMode("demo");
      setLoading(false);
      return;
    }

    const loadedJobs = (data as DatabaseJobRow[]).map(mapJob);
    setJobs(loadedJobs);
    setSelectedId((current) => loadedJobs.some((job) => job.id === current) ? current : loadedJobs[0].id);
    setDataMode("backend");

    if (activeUser) {
      const [saves, applications] = await Promise.all([
        supabase.from("job_saves").select("job_id").eq("user_id", activeUser.id),
        supabase.from("job_applications").select("job_id").eq("applicant_id", activeUser.id),
      ]);
      setSavedIds(saves.error ? [] : (saves.data || []).map((item) => item.job_id));
      setAppliedIds(applications.error ? [] : (applications.data || []).map((item) => item.job_id));
    } else {
      setSavedIds([]);
      setAppliedIds([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!supabase) {
      void loadJobs(null);
      return;
    }
    if (!authReady) return;
    void loadJobs(user);
  }, [authReady, user]);

  const visibleJobs = useMemo(() => jobs.filter((job) => {
    const searchable = (job.title + " " + job.company + " " + job.location + " " + job.skills.join(" ")).toLowerCase();
    if (search && !searchable.includes(search.toLowerCase())) return false;
    if (workMode !== "all" && job.workMode !== workMode) return false;
    if (tab === "freelance" && job.employmentType !== "freelance") return false;
    if (tab === "full_time" && job.employmentType !== "full_time") return false;
    if (tab === "saved" && !savedIds.includes(job.id)) return false;
    if (tab === "applied" && !appliedIds.includes(job.id)) return false;
    return true;
  }), [jobs, tab, search, workMode, savedIds, appliedIds]);

  useEffect(() => {
    if (visibleJobs.length && !visibleJobs.some((job) => job.id === selectedId)) setSelectedId(visibleJobs[0].id);
  }, [visibleJobs, selectedId]);

  const selected = jobs.find((job) => job.id === selectedId) || visibleJobs[0] || jobs[0];

  function requireAccount() {
    if (dataMode === "demo" || !supabase) return true;
    if (user) return true;
    setAuthOpen(true);
    notify("Хадгалах, хүсэлт илгээхийн тулд нэвтэрнэ үү.");
    return false;
  }

  async function toggleSaved(job: Job) {
    if (!requireAccount()) return;
    const wasSaved = savedIds.includes(job.id);
    const next = wasSaved ? savedIds.filter((id) => id !== job.id) : [...savedIds, job.id];
    setSavedIds(next);
    if (dataMode === "demo" || !supabase || !user) {
      persistDemoState("saved", next);
      notify(wasSaved ? "Хадгалснаас хаслаа." : "Ажлыг хадгаллаа.");
      return;
    }
    const result = wasSaved
      ? await supabase.from("job_saves").delete().eq("job_id", job.id).eq("user_id", user.id)
      : await supabase.from("job_saves").insert({ job_id: job.id, user_id: user.id });
    if (result.error) {
      setSavedIds(savedIds);
      notify(result.error.message);
      return;
    }
    notify(wasSaved ? "Хадгалснаас хаслаа." : "Ажлыг хадгаллаа.");
  }

  function openApplication() {
    if (!selected || !requireAccount()) return;
    if (appliedIds.includes(selected.id)) {
      notify("Та энэ ажилд хүсэлт илгээсэн байна.");
      return;
    }
    setCoverLetter("");
    setApplicationStep(selected.workMode === "on_site" ? "location" : "form");
    setApplicationOpen(true);
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const next = [...appliedIds, selected.id];
    if (dataMode === "demo" || !supabase || !user) {
      setAppliedIds(next);
      persistDemoState("applied", next);
      setJobs((all) => all.map((job) => job.id === selected.id ? { ...job, applicantsCount: job.applicantsCount + 1 } : job));
      setApplicationOpen(false);
      notify("Demo горимд хүсэлт илгээгдлээ.");
      return;
    }
    const { error } = await supabase.from("job_applications").insert({ job_id: selected.id, applicant_id: user.id, cover_letter: coverLetter.trim() });
    if (error) {
      notify(error.code === "23505" ? "Энэ ажилд аль хэдийн хүсэлт илгээсэн байна." : error.message);
      return;
    }
    setAppliedIds(next);
    setJobs((all) => all.map((job) => job.id === selected.id ? { ...job, applicantsCount: job.applicantsCount + 1 } : job));
    setApplicationOpen(false);
    notify("Хүсэлт амжилттай илгээгдлээ.");
  }

  function openChoice() {
    if (!requireAccount()) return;
    setChoiceOpen(true);
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setAuthOpen(false);
      notify("Demo горимд нэвтрэх шаардлагагүй.");
      return;
    }
    setAuthBusy(true);
    const result = authMode === "signin"
      ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      : await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { display_name: authName.trim() } } });
    setAuthBusy(false);
    if (result.error) {
      notify(result.error.message);
      return;
    }
    setAuthPassword("");
    setAuthOpen(false);
    notify(authMode === "signup" && !result.data.session ? "Баталгаажуулах имэйлээ шалгаад нэвтэрнэ үү." : "Амжилттай нэвтэрлээ.");
  }

  const tabs: { id: JobsTab; label: string; badge?: string }[] = [
    { id: "for_you", label: "Танд тохирох" },
    { id: "freelance", label: "Freelance", badge: "PRO" },
    { id: "full_time", label: "Бүтэн цаг" },
    { id: "saved", label: "Хадгалсан" },
    { id: "applied", label: "Илгээсэн" },
  ];

  return <main className="jobs-page">
    <SiteHeader activePage="jobs" onLogin={() => setAuthOpen(true)} onSignOut={() => notify("Системээс гарлаа.")} />

    <div className="jobs-tabs" role="tablist" aria-label="Ажлын төрлүүд">
      <div className="jobs-tabs-scroll">
        {tabs.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>{item.label}{item.badge && <b>{item.badge}</b>}{item.id === "saved" && savedIds.length > 0 && <i>{savedIds.length}</i>}{item.id === "applied" && appliedIds.length > 0 && <i>{appliedIds.length}</i>}</button>)}
      </div>
      <button type="button" className="apply new-job-btn" onClick={openChoice}><Icon name="plus" /><span>Шинэ ажил</span></button>
    </div>

    <section className={applicationOpen ? "jobs-workspace application-open" : "jobs-workspace"}>
      <aside className="jobs-list" aria-label="Ажлын жагсаалт">
        <div className="jobs-list-tools">
          <div><strong>{loading ? "…" : visibleJobs.length}</strong><span>ажлын санал</span></div>
          <label className="jobs-search"><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ажил, ур чадвар хайх" /></label>
        </div>
        <div className="jobs-filter-row">
          <button className={workMode === "all" ? "active" : ""} onClick={() => setWorkMode("all")}>Бүгд</button>
          <button className={workMode === "remote" ? "active" : ""} onClick={() => setWorkMode("remote")}>Remote</button>
          <button className={workMode === "hybrid" ? "active" : ""} onClick={() => setWorkMode("hybrid")}>Hybrid</button>
          <button className={workMode === "on_site" ? "active" : ""} onClick={() => setWorkMode("on_site")}>On-site</button>
        </div>
        <div className="jobs-scroll-list">
          {loading ? Array.from({ length: 7 }).map((_, index) => <div key={index} className="job-list-item skeleton-row" aria-hidden="true">
            <span className="job-logo skeleton" />
            <span className="job-list-copy">
              <span className="skeleton skeleton-line" style={{ width: "78%", height: 11 }} />
              <span className="skeleton skeleton-line" style={{ width: "50%", marginTop: 8 }} />
              <span className="job-list-meta"><span className="skeleton skeleton-line" style={{ width: 60, height: 14, borderRadius: 8, marginTop: 9 }} /></span>
            </span>
          </div>) : visibleJobs.map((job) => <button key={job.id} className={selected?.id === job.id ? "job-list-item selected" : "job-list-item"} onClick={() => setSelectedId(job.id)}>
            <span className="job-logo" style={{ background: job.companyColor }}>{job.company.slice(0, 1)}</span>
            <span className="job-list-copy"><strong>{job.title}</strong><small>{job.company} · {job.location}</small><span className="job-list-meta"><em className={job.employmentType}>{friendlyType(job.employmentType)}</em><b>{job.salary}</b></span></span>
            <span className="job-more"><Icon name="more" /></span>
          </button>)}
          {!loading && visibleJobs.length === 0 && <div className="jobs-empty"><Icon name="search" /><strong>Ажил олдсонгүй</strong><p>Хайлт эсвэл шүүлтүүрээ өөрчилж үзнэ үү.</p></div>}
        </div>
      </aside>

      <article className="job-detail" aria-live="polite">
        {loading ? <div className="job-detail-skeleton" aria-hidden="true">
          <div className="job-detail-skeleton-head">
            <span className="job-logo large skeleton" />
            <div className="job-detail-skeleton-head-lines">
              <span className="skeleton skeleton-line" style={{ width: "55%", height: 20 }} />
              <span className="skeleton skeleton-line" style={{ width: "35%" }} />
            </div>
          </div>
          <div className="job-detail-skeleton-body">
            <span className="skeleton job-detail-skeleton-main" />
            <span className="skeleton job-detail-skeleton-side" />
          </div>
        </div> : selected ? <>
          <div className="job-detail-head">
            <span className="job-logo large" style={{ background: selected.companyColor }}>{selected.company.slice(0, 1)}</span>
            <div><p className="job-kicker"><Icon name="clock" />{relativeDate(selected.publishedAt)}</p><h1>{selected.title}</h1><p className="job-company">{selected.company}<span>·</span><Icon name="pin" />{selected.location}<span>·</span>{friendlyMode(selected.workMode)}</p></div>
          </div>
          <div className="job-detail-actions">
            <button className={appliedIds.includes(selected.id) ? "apply applied" : "apply"} onClick={openApplication}>{appliedIds.includes(selected.id) ? "Хүсэлт илгээсэн" : "Хүсэлт илгээх"}</button>
            <button className={savedIds.includes(selected.id) ? "save-job saved" : "save-job"} onClick={() => void toggleSaved(selected)}><Icon name={savedIds.includes(selected.id) ? "bookmarkFill" : "bookmark"} />{savedIds.includes(selected.id) ? "Хадгалсан" : "Хадгалах"}</button>
            <b className="job-salary">{selected.salary}</b>
          </div>
          <div className="job-detail-body">
            <div className="job-description">
              <p className="job-intro">{selected.description}</p>
              <h2>Таны хийх ажил</h2>
              <ul>{selected.responsibilities.length ? selected.responsibilities.map((item) => <li key={item}><Icon name="check" />{item}</li>) : <li><Icon name="check" />Төслийн багтай уялдан чиг үүргээ хэрэгжүүлэх</li>}</ul>
              <h2>Тавигдах шаардлага</h2>
              <ul>{selected.requirements.length ? selected.requirements.map((item) => <li key={item}><Icon name="check" />{item}</li>) : <li><Icon name="check" />Portfolio болон холбогдох туршлагатай байх</li>}</ul>
              <div className="job-apply-card"><div><span><Icon name="spark" />Project X profile</span><h3>Portfolio-оороо онцгой сэтгэгдэл үлдээгээрэй.</h3><p>Хүсэлт илгээхэд таны Project X профайл болон товч танилцуулга ажил олгогчид хүрнэ.</p></div><button className={appliedIds.includes(selected.id) ? "apply applied" : "apply"} onClick={openApplication}>{appliedIds.includes(selected.id) ? "Илгээсэн" : "Одоо хүсэлт илгээх"}<Icon name="arrow" /></button></div>
            </div>
            <aside className="job-facts">
              <div><small>АЖЛЫН ТӨРӨЛ</small><b><Icon name="briefcase" />{friendlyType(selected.employmentType)}</b></div>
              <div><small>АЖИЛЛАХ ХЭЛБЭР</small><b>{friendlyMode(selected.workMode)}</b></div>
              <div><small>БАЙРШИЛ</small><b>{selected.location}</b></div>
              <div><small>ХҮСЭЛТ ИРСЭН</small><b>{selected.applicantsCount} хүн</b></div>
              <div><small>ХОЛБОГДОХ ХҮН</small><b>{selected.hiringContact}</b><span>{selected.contactRole}</span></div>
              <div><small>УР ЧАДВАР</small><p>{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</p></div>
            </aside>
          </div>
        </> : <div className="job-detail-empty"><Icon name="briefcase" /><h1>Ажлаа сонгоно уу</h1><p>Зүүн талын жагсаалтаас зар сонгоход дэлгэрэнгүй мэдээлэл харагдана.</p></div>}
      </article>
      {applicationOpen && selected && <aside className="application-panel" aria-label="Ажлын хүсэлт">
        <div className="application-panel-head"><div><p className="modal-kicker">Project X Jobs</p><h2>{applicationStep === "location" ? "Ажлын байршлыг баталгаажуулах" : "Энэ ажилд хүсэлт илгээх"}</h2></div><button className="application-panel-close" onClick={() => setApplicationOpen(false)} aria-label="Хаах"><Icon name="close" /></button></div>
        {applicationStep === "location" ? <div className="location-check"><span className="location-check-icon"><Icon name="pin" /></span><h3>Энэ ажил {selected.location}-д on-site байна.</h3><p>Таны профайлын байршил Монгол гэж харагдаж байна. Та энэ байршлаас ажиллах боломжтой юу?</p><div><button className="apply" onClick={() => setApplicationStep("form")}>Тийм, боломжтой</button><button className="location-decline" onClick={() => { setApplicationOpen(false); notify("Таны хүсэлт илгээгдсэнгүй."); }}>Үгүй, тохирохгүй</button></div></div> : <form className="application-form" onSubmit={(event) => void submitApplication(event)}>
          <p className="application-caption">Таны Project X профайл болон доорх message ажил олгогчид очно.</p>
          <section className="applicant-profile"><span className="applicant-avatar">{(user?.user_metadata.display_name || user?.email || "P").slice(0, 1).toUpperCase()}</span><div><strong>{user?.user_metadata.display_name || user?.email?.split("@")[0] || "Project X хэрэглэгч"}</strong><span>Монгол</span></div></section>
          <section className="profile-experience"><div><strong>Туршлага</strong><button type="button">Профайлаа гүйцээх</button></div><p><Icon name="spark" />Профайл дээр таны ажлын туршлага хараахан нэмэгдээгүй байна.</p></section>
          <label className="application-message">Таны message<textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} rows={8} placeholder="Яагаад энэ ажил танд тохирохыг, ямар туршлагаа ашиглахыг товч бичнэ үү..." /></label>
          <label className="application-consent"><input required type="checkbox" /> <span>Миний Project X профайлыг ажил олгогчид харагдуулахыг зөвшөөрч байна.</span></label>
          <button className="modal-submit" type="submit">Хүсэлт илгээх <Icon name="arrow" /></button>
        </form>}
      </aside>}
    </section>

    {choiceOpen && <div className="jobs-modal-backdrop" onClick={() => setChoiceOpen(false)}><section className="jobs-modal choice-modal" onClick={(event) => event.stopPropagation()}><button className="jobs-modal-close" onClick={() => setChoiceOpen(false)}><Icon name="close" /></button><p className="modal-kicker">Шинэ ажил</p><h2>Юу хийхийг хүсэж байна вэ?</h2><div className="choice-grid">
      <div className="choice-card highlight">
        <p className="modal-kicker">Freelance</p>
        <h3>Фрийлансер хөлслөх</h3>
        <p className="choice-copy">Тохирох бүтээлчийг хэдхэн минутанд ол.</p>
        <ul>
          <li><Icon name="check" />Хэрэгцээндээ тохирсон саналуудыг ав</li>
          <li><Icon name="check" />Шууд мессеж бичиж, файл солилцох</li>
          <li><Icon name="check" />Картаар аюулгүй, шуурхай төлбөр хийх</li>
        </ul>
        <Link className="apply" href="/hire/jobs/create">Одоо хайж эхлэх <Icon name="arrow" /></Link>
      </div>
      <div className="choice-card">
        <p className="modal-kicker">Бүтэн цаг / Гэрээт</p>
        <h3>Ажлын зар байршуулах</h3>
        <p className="choice-copy">Бүтэн цаг эсвэл гэрээт ажлын байрны зараа нийтэл.</p>
        <ul>
          <li><Icon name="check" />Сая гаруй бүтээлчид зараа хүргэ</li>
          <li><Icon name="check" />Ирсэн хүсэлтүүдийг удирдах</li>
          <li><Icon name="check" />Шууд холбогдож ажилд авах</li>
        </ul>
        <Link className="save-job" href="/jobs/create">Зар байршуулах</Link>
      </div>
    </div></section></div>}

    {authOpen && <div className="jobs-modal-backdrop" onClick={() => setAuthOpen(false)}><section className="jobs-modal auth-modal" onClick={(event) => event.stopPropagation()}><button className="jobs-modal-close" onClick={() => setAuthOpen(false)}><Icon name="close" /></button><p className="modal-kicker">Project X account</p><h2>{authMode === "signin" ? "Нэвтрэх" : "Бүртгэл үүсгэх"}</h2><p className="modal-subtitle">Ажил хадгалах, хүсэлт илгээх, зар оруулахын тулд нэвтэрнэ үү.</p><form onSubmit={(event) => void submitAuth(event)}>{authMode === "signup" && <label>Нэр<input required value={authName} onChange={(event) => setAuthName(event.target.value)} /></label>}<label>Имэйл<input required type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} /></label><label>Нууц үг<input required type="password" minLength={6} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} /></label><button className="modal-submit" disabled={authBusy} type="submit">{authBusy ? "Түр хүлээнэ үү…" : authMode === "signin" ? "Нэвтрэх" : "Бүртгүүлэх"}</button></form><button className="auth-switch" onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}>{authMode === "signin" ? "Шинэ хэрэглэгч үү? Бүртгүүлэх" : "Бүртгэлтэй юу? Нэвтрэх"}</button></section></div>}

    {toast && <div className="jobs-toast">{toast}</div>}
  </main>;
}
