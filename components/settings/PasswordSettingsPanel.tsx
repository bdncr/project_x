"use client";

import { FormEvent, useState } from "react";
import { SettingsPanel } from "./SettingsPanel";
import { changePassword, type SettingsResult } from "../../lib/settings-actions";

type PasswordSettingsPanelProps = {
  onResult: (result: SettingsResult) => void;
};

export function PasswordSettingsPanel({ onResult }: PasswordSettingsPanelProps) {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const result = await changePassword(next, confirm);
    setBusy(false);
    onResult(result);
    if (result.ok) { setNext(""); setConfirm(""); }
  };

  return <SettingsPanel
    title="Нууц үг солих"
    description="Шинэ нууц үг дор хаяж 6 тэмдэгт байх ёстой. Солисны дараа энэ төхөөрөмж нэвтэрсэн хэвээр үлдэнэ."
    busy={busy} submitLabel="Нууц үг шинэчлэх" busyLabel="Шинэчилж байна…"
    onSubmit={(event) => void submit(event)}
  >
    <label>Шинэ нууц үг<input required type="password" minLength={6} value={next} onChange={(event) => setNext(event.target.value)} /></label>
    <label>Шинэ нууц үг давтах<input required type="password" minLength={6} value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
  </SettingsPanel>;
}
