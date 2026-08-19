"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { SiteHeader } from "../../components/SiteHeader";
import { AuthDialog, AuthMode } from "../../components/AuthDialog";
import { Toast } from "../../components/Toast";
import { JobsTabs, JobsTab } from "../../components/jobs/JobsTabs";
import { JobsSidebar } from "../../components/jobs/JobsSidebar";
import { JobDetailPanel } from "../../components/jobs/JobDetailPanel";
import { ApplicationPanel } from "../../components/jobs/ApplicationPanel";
import { ChoiceModal } from "../../components/jobs/ChoiceModal";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/AuthProvider";
import { Job, WorkMode } from "../../lib/job-samples";
import { DatabaseJobRow, loadDemoJobs, loadDemoJobState, mapJob, persistDemoJobState } from "../../lib/jobs-data";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(() => (supabase ? [] : loadDemoJobs()));
  const [selectedId, setSelectedId] = useState(() => (supabase ? "" : loadDemoJobs()[0].id));
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
      const jobList = loadDemoJobs();
      setJobs(jobList);
      setSelectedId((current) => jobList.some((job) => job.id === current) ? current : jobList[0].id);
      setSavedIds(loadDemoJobState("saved"));
      setAppliedIds(loadDemoJobState("applied"));
      setDataMode("demo");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("job_posts").select("*").eq("status", "active").order("published_at", { ascending: false });
    if (error || !data || data.length === 0) {
      const jobList = loadDemoJobs();
      setJobs(jobList);
      setSelectedId((current) => jobList.some((job) => job.id === current) ? current : jobList[0].id);
      setSavedIds(loadDemoJobState("saved"));
      setAppliedIds(loadDemoJobState("applied"));
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
      persistDemoJobState("saved", next);
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
      persistDemoJobState("applied", next);
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

  return <main className="jobs-page">
    <SiteHeader activePage="jobs" onLogin={() => setAuthOpen(true)} onSignOut={() => notify("Системээс гарлаа.")} />

    <JobsTabs tab={tab} onTabChange={setTab} savedCount={savedIds.length} appliedCount={appliedIds.length} onNewJob={openChoice} />

    <section className={applicationOpen ? "jobs-workspace application-open" : "jobs-workspace"}>
      <JobsSidebar loading={loading} jobs={visibleJobs} selectedId={selected?.id} onSelect={setSelectedId} search={search} onSearchChange={setSearch} workMode={workMode} onWorkModeChange={setWorkMode} />

      <JobDetailPanel
        loading={loading}
        selected={selected}
        applied={!!selected && appliedIds.includes(selected.id)}
        saved={!!selected && savedIds.includes(selected.id)}
        onToggleSaved={() => selected && void toggleSaved(selected)}
        onOpenApplication={openApplication}
      />

      {applicationOpen && selected && <ApplicationPanel
        selected={selected}
        step={applicationStep}
        onConfirmLocation={() => setApplicationStep("form")}
        onDeclineLocation={() => { setApplicationOpen(false); notify("Таны хүсэлт илгээгдсэнгүй."); }}
        coverLetter={coverLetter}
        onCoverLetterChange={setCoverLetter}
        onSubmit={(event) => void submitApplication(event)}
        onClose={() => setApplicationOpen(false)}
        applicantName={user?.user_metadata.display_name || user?.email?.split("@")[0] || "Project X хэрэглэгч"}
        applicantInitial={(user?.user_metadata.display_name || user?.email || "P").slice(0, 1).toUpperCase()}
      />}
    </section>

    {choiceOpen && <ChoiceModal onClose={() => setChoiceOpen(false)} />}

    {authOpen && <AuthDialog
      variant="jobs"
      mode={authMode} onModeChange={setAuthMode}
      name={authName} onNameChange={setAuthName}
      email={authEmail} onEmailChange={setAuthEmail}
      password={authPassword} onPasswordChange={setAuthPassword}
      busy={authBusy}
      subtitle="Ажил хадгалах, хүсэлт илгээх, зар оруулахын тулд нэвтэрнэ үү."
      onClose={() => setAuthOpen(false)} onSubmit={(event) => void submitAuth(event)}
    />}

    <Toast message={toast} className="jobs-toast" />
  </main>;
}
