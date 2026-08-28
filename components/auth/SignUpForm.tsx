"use client";

import { EmailField, NameField, PasswordField } from "./AuthFields";
import type { AuthFormProps } from "./types";

type SignUpFormProps = AuthFormProps & {
  /** Becomes the profile's display_name via handle_new_user() — see supabase/schema.sql. */
  name: string;
  onNameChange: (value: string) => void;
};

/** New account: display name on top of the shared credential fields. */
export function SignUpForm({ name, onNameChange, email, onEmailChange, password, onPasswordChange, busy, submitClassName, onSubmit }: SignUpFormProps) {
  return <form onSubmit={onSubmit}>
    <NameField value={name} onChange={onNameChange} />
    <EmailField value={email} onChange={onEmailChange} />
    <PasswordField value={password} onChange={onPasswordChange} />
    <button className={submitClassName} disabled={busy} type="submit">{busy ? "Түр хүлээнэ үү…" : "Бүртгүүлэх"}</button>
  </form>;
}
