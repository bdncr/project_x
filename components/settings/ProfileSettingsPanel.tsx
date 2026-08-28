"use client";

import { FormEvent, useState } from "react";
import { SettingsPanel } from "./SettingsPanel";
import { SELECTABLE_EMPLOYMENT_TAGS } from "../../lib/creator-samples";
import { saveProfileSettings, type SettingsResult } from "../../lib/settings-actions";

export type ProfileFormValues = {
  username: string;
  displayName: string;
  headline: string;
  location: string;
  employmentTags: string[];
  avatarUrl: string;
  coverUrl: string;
  featured: boolean;
};

type ProfileSettingsPanelProps = {
  userId: string;
  initial: ProfileFormValues;
  onResult: (result: SettingsResult) => void;
};

export function ProfileSettingsPanel({ userId, initial, onResult }: ProfileSettingsPanelProps) {
  const [values, setValues] = useState<ProfileFormValues>(initial);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const toggleTag = (tag: string) =>
    set("employmentTags", values.employmentTags.includes(tag)
      ? values.employmentTags.filter((item) => item !== tag)
      : [...values.employmentTags, tag]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    onResult(await saveProfileSettings({ userId, ...values }));
    setBusy(false);
  };

  return <SettingsPanel
    title="Профайл"
    description="Энэ мэдээлэл таны нийтийн профайл болон Хүмүүс хуудсанд харагдана."
    busy={busy} submitLabel="Хадгалах" busyLabel="Хадгалж байна…"
    onSubmit={(event) => void submit(event)}
  >
    <label>Харагдах нэр<input required value={values.displayName} onChange={(event) => set("displayName", event.target.value)} /></label>
    <label>Хэрэглэгчийн нэр<input required value={values.username} onChange={(event) => set("username", event.target.value)} placeholder="жишээ: bilguun_l" /></label>
    <label>Мэргэжил / ажлын байдал<input value={values.headline} onChange={(event) => set("headline", event.target.value)} placeholder="Жишээ: Brand Designer" /></label>
    <label>Байршил<input value={values.location} onChange={(event) => set("location", event.target.value)} placeholder="Улаанбаатар" /></label>
    <label>Профайл зургийн холбоос<input type="url" value={values.avatarUrl} onChange={(event) => set("avatarUrl", event.target.value)} placeholder="https://…" /></label>
    <label>Ковер зургийн холбоос<input type="url" value={values.coverUrl} onChange={(event) => set("coverUrl", event.target.value)} placeholder="https://…" /></label>
    <div className="settings-tags">
      <span>Ажлын төлөв</span>
      <div className="settings-tag-options">
        {SELECTABLE_EMPLOYMENT_TAGS.map((tag) => <label key={tag} className="settings-tag-option">
          <input type="checkbox" checked={values.employmentTags.includes(tag)} onChange={() => toggleTag(tag)} />
          {tag}
        </label>)}
      </div>
      {values.featured && <small className="settings-hint">«Онцлох» тэмдэг нь платформаас олгогддог тул энд сонгогддоггүй, хадгалахад хэвээр үлдэнэ.</small>}
    </div>
  </SettingsPanel>;
}
