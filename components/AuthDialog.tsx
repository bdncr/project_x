"use client";

import type { FormEvent } from "react";
import { Icon } from "./Icon";

export type AuthMode = "signin" | "signup";

type AuthDialogProps = {
  /** "jobs" reuses the jobs-modal chrome; "default" reuses the site-wide auth-dialog chrome. */
  variant?: "default" | "jobs";
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  name: string;
  onNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  busy: boolean;
  subtitle?: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

/** Shared login/signup modal — reused on the explore page, project detail page, and jobs page. */
export function AuthDialog({ variant = "default", mode, onModeChange, name, onNameChange, email, onEmailChange, password, onPasswordChange, busy, subtitle, onClose, onSubmit }: AuthDialogProps) {
  const isJobs = variant === "jobs";

  return <div className={isJobs ? "jobs-modal-backdrop" : "modal-backdrop"} onClick={onClose}>
    <section className={isJobs ? "jobs-modal auth-modal" : "auth-dialog"} onClick={(event) => event.stopPropagation()}>
      <button className={isJobs ? "jobs-modal-close" : "modal-close"} onClick={onClose}><Icon name="close" /></button>
      <p className={isJobs ? "modal-kicker" : "kicker"}>Project X account</p>
      <h2>{mode === "signin" ? "Нэвтрэх" : "Бүртгэл үүсгэх"}</h2>
      {subtitle && <p className="modal-subtitle">{subtitle}</p>}
      <form onSubmit={onSubmit}>
        {mode === "signup" && <label>Нэр<input required value={name} onChange={(event) => onNameChange(event.target.value)} /></label>}
        <label>Имэйл<input required type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} /></label>
        <label>Нууц үг<input required type="password" minLength={6} value={password} onChange={(event) => onPasswordChange(event.target.value)} /></label>
        <button className={isJobs ? "modal-submit" : "auth-submit"} disabled={busy} type="submit">{busy ? "Түр хүлээнэ үү…" : mode === "signin" ? "Нэвтрэх" : "Бүртгүүлэх"}</button>
      </form>
      <button className="auth-switch" onClick={() => onModeChange(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Шинэ хэрэглэгч үү? Бүртгүүлэх" : "Бүртгэлтэй юу? Нэвтрэх"}</button>
    </section>
  </div>;
}
