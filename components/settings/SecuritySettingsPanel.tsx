"use client";

import { FormEvent, useState } from "react";
import { SettingsPanel } from "./SettingsPanel";
import { signOutEverywhere, type SettingsResult } from "../../lib/settings-actions";

type SecuritySettingsPanelProps = {
  email: string;
  joinedAt?: string;
  onResult: (result: SettingsResult) => void;
};

export function SecuritySettingsPanel({ email, joinedAt, onResult }: SecuritySettingsPanelProps) {
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    onResult(await signOutEverywhere());
    setBusy(false);
  };

  return <SettingsPanel
    title="Аюулгүй байдал"
    description="Бусад төхөөрөмж дээр нэвтэрсэн хэвээр байвал энд бүгдийг нь салгаж болно."
    busy={busy} submitLabel="Бүх төхөөрөмжөөс гарах" busyLabel="Гарч байна…"
    onSubmit={(event) => void submit(event)}
    footer={<p className="settings-hint">Энэ үйлдэл энэ хөтчийг ч мөн салгана — дахин нэвтрэх шаардлагатай.</p>}
  >
    <div className="settings-readout">
      <div><span>Имэйл</span><strong>{email}</strong></div>
      {joinedAt && <div><span>Бүртгүүлсэн</span><strong>{new Date(joinedAt).toLocaleDateString("mn-MN")}</strong></div>}
    </div>
  </SettingsPanel>;
}
