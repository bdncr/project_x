"use client";

import { EmailField } from "./AuthFields";
import type { AuthFormProps } from "./types";

/** Email only. Supabase mails a recovery link that lands on /auth/reset, where the new
 * password is actually set — nothing is changed from this form. */
export function ForgotPasswordForm({ email, onEmailChange, busy, submitClassName, onSubmit }: AuthFormProps) {
  return <form onSubmit={onSubmit}>
    <EmailField value={email} onChange={onEmailChange} />
    <button className={submitClassName} disabled={busy} type="submit">{busy ? "Илгээж байна…" : "Сэргээх холбоос илгээх"}</button>
  </form>;
}
