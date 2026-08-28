"use client";

import { EmailField, PasswordField } from "./AuthFields";
import type { AuthFormProps } from "./types";

/** Returning user: email and password only. */
export function SignInForm({ email, onEmailChange, password, onPasswordChange, busy, submitClassName, onSubmit }: AuthFormProps) {
  return <form onSubmit={onSubmit}>
    <EmailField value={email} onChange={onEmailChange} />
    <PasswordField value={password} onChange={onPasswordChange} />
    <button className={submitClassName} disabled={busy} type="submit">{busy ? "Түр хүлээнэ үү…" : "Нэвтрэх"}</button>
  </form>;
}
