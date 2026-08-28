"use client";

import { FormEvent, useEffect, useState } from "react";
import { SiteHeader } from "../../components/SiteHeader";
import { SiteFooter } from "../../components/SiteFooter";
import { Toast } from "../../components/Toast";
import { AuthDialog, AuthMode } from "../../components/auth/AuthDialog";
import { SettingsNav } from "../../components/settings/SettingsNav";
import { ProfileSettingsPanel, type ProfileFormValues } from "../../components/settings/ProfileSettingsPanel";
import { PasswordSettingsPanel } from "../../components/settings/PasswordSettingsPanel";
import { EmailSettingsPanel } from "../../components/settings/EmailSettingsPanel";
import { SecuritySettingsPanel } from "../../components/settings/SecuritySettingsPanel";
import type { SettingsSection } from "../../components/settings/types";
import { useAuth } from "../../lib/AuthProvider";
import { supabase } from "../../lib/supabase";
import { runAuthSubmit } from "../../lib/auth-actions";
import type { SettingsResult } from "../../lib/settings-actions";

type ProfileRow = {
  username: string;
  display_name: string;
  headline: string | null;
  location: string | null;
  employment_tags: string[] | null;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string;
};

export default function SettingsPage() {
  const { user, authReady } = useAuth();
  const [section, setSection] = useState<SettingsSection>("profile");
  const [profile, setProfile] = useState<ProfileFormValues | null>(null);
  const [joinedAt, setJoinedAt] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3200); };
  const handleResult = (result: SettingsResult) => notify(result.message);

  useEffect(() => {
    if (!authReady) return;
    const client = supabase;
    const currentUser = user;
    if (!client || !currentUser) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      const { data, error } = await client!.from("profiles")
        .select("username,display_name,headline,location,employment_tags,avatar_url,cover_url,created_at")
        .eq("id", currentUser!.id).maybeSingle();
      if (cancelled) return;
      if (error || !data) { notify(error?.message ?? "Профайл олдсонгүй."); setLoading(false); return; }
      const row = data as ProfileRow;
      const tags = row.employment_tags ?? [];
      setProfile({
        username: row.username,
        displayName: row.display_name,
        headline: row.headline ?? "",
        location: row.location ?? "",
        // "Онцлох" is platform-awarded, so it is held aside rather than offered as a checkbox.
        employmentTags: tags.filter((tag) => tag !== "Онцлох"),
        avatarUrl: row.avatar_url ?? "",
        coverUrl: row.cover_url ?? "",
        featured: tags.includes("Онцлох"),
      });
      setJoinedAt(row.created_at);
      setLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, [authReady, user]);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthBusy(true);
    const result = await runAuthSubmit({ mode: authMode, email: authEmail, password: authPassword, displayName });
    setAuthBusy(false); notify(result.message);
    if (result.close) { setAuthOpen(false); setAuthPassword(""); }
  };

  const signedOut = authReady && !user;

  return <main className="page-shell">
    <SiteHeader activePage="explore" onLogin={() => setAuthOpen(true)} onSignOut={() => notify("Системээс гарлаа.")} />
    <section className="settings-page">
      <header className="settings-head">
        <h1>Тохиргоо</h1>
        <p>Бүртгэл, профайл, аюулгүй байдлын тохиргоо.</p>
      </header>

      {!authReady || loading
        ? <div className="settings-body"><div className="settings-panel skeleton" aria-hidden="true" style={{ height: 320 }} /></div>
        : signedOut
          ? <div className="settings-panel settings-gate">
              <h2>Нэвтэрнэ үү</h2>
              <p>Тохиргоог үзэхийн тулд эхлээд бүртгэлдээ нэвтэрнэ үү.</p>
              <button type="button" className="settings-save" onClick={() => setAuthOpen(true)}>Нэвтрэх</button>
            </div>
          : <div className="settings-body">
              <SettingsNav active={section} onChange={setSection} />
              <div className="settings-content">
                {section === "profile" && (profile
                  ? <ProfileSettingsPanel userId={user!.id} initial={profile} onResult={handleResult} />
                  : <div className="settings-panel"><p className="settings-hint">Профайл ачаалж чадсангүй.</p></div>)}
                {section === "password" && <PasswordSettingsPanel onResult={handleResult} />}
                {section === "email" && <EmailSettingsPanel currentEmail={user!.email ?? ""} onResult={handleResult} />}
                {section === "security" && <SecuritySettingsPanel email={user!.email ?? ""} joinedAt={joinedAt} onResult={handleResult} />}
              </div>
            </div>}
    </section>
    <SiteFooter backendConnected={!!supabase} />
    {authOpen && <AuthDialog
      mode={authMode} onModeChange={setAuthMode}
      name={displayName} onNameChange={setDisplayName}
      email={authEmail} onEmailChange={setAuthEmail}
      password={authPassword} onPasswordChange={setAuthPassword}
      busy={authBusy} onClose={() => setAuthOpen(false)} onSubmit={(event) => void submitAuth(event)}
    />}
    <Toast message={toast} />
  </main>;
}
