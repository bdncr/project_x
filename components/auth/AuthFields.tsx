"use client";

/** The inputs both auth forms are built from. Kept in one place so sign-in and sign-up
 * can't drift apart on labels or validation rules as either form grows. */

type FieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function NameField({ value, onChange }: FieldProps) {
  return <label>Нэр<input required value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

export function EmailField({ value, onChange }: FieldProps) {
  return <label>Имэйл<input required type="email" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

/** minLength mirrors Supabase's own six-character floor so signup is caught in the browser
 * instead of round-tripping. Sign-in renders the same field, matching the single combined
 * form this was split out of — the server, not the browser, rejects a wrong password. */
export function PasswordField({ value, onChange }: FieldProps) {
  return <label>Нууц үг<input required type="password" minLength={6} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
