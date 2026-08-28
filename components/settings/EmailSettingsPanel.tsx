"use client";

import { FormEvent, useState } from "react";
import { SettingsPanel } from "./SettingsPanel";
import { changeEmail, type SettingsResult } from "../../lib/settings-actions";

type EmailSettingsPanelProps = {
  currentEmail: string;
  onResult: (result: SettingsResult) => void;
};

export function EmailSettingsPanel({ currentEmail, onResult }: EmailSettingsPanelProps) {
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const result = await changeEmail(next);
    setBusy(false);
    onResult(result);
    if (result.ok) setNext("");
  };

  return <SettingsPanel
    title="Имэйл солих"
    description="Шинэ хаяг руу баталгаажуулах холбоос илгээгдэнэ. Холбоосыг нээх хүртэл хуучин хаяг хэвээр ажиллана."
    busy={busy} submitLabel="Баталгаажуулах холбоос илгээх" busyLabel="Илгээж байна…"
    onSubmit={(event) => void submit(event)}
  >
    <label>Одоогийн имэйл<input value={currentEmail} readOnly disabled /></label>
    <label>Шинэ имэйл<input required type="email" value={next} onChange={(event) => setNext(event.target.value)} /></label>
  </SettingsPanel>;
}
