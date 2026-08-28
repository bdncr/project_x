"use client";

import type { FormEvent } from "react";
import { Icon } from "../Icon";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import type { AuthMode } from "./types";

export type { AuthMode } from "./types";

const HEADING: Record<AuthMode, string> = {
  signin: "Нэвтрэх",
  signup: "Бүртгэл үүсгэх",
  reset: "Нууц үг сэргээх",
};

/** Where the footer link goes from each mode. Reset returns to sign-in, since the user
 * finishes the flow in their inbox rather than here. */
const SWITCH_TO: Record<AuthMode, AuthMode> = { signin: "signup", signup: "signin", reset: "signin" };
const SWITCH_LABEL: Record<AuthMode, string> = {
  signin: "Шинэ хэрэглэгч үү? Бүртгүүлэх",
  signup: "Бүртгэлтэй юу? Нэвтрэх",
  reset: "← Нэвтрэх рүү буцах",
};

const RESET_HINT = "Бүртгэлтэй имэйл хаягаа оруулна уу. Нууц үг сэргээх холбоосыг илгээнэ.";

type AuthDialogProps = {
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

/** Modal chrome and mode switching only — the fields live in SignInForm / SignUpForm /
 * ForgotPasswordForm. Reused on the explore, project detail, profile, people and jobs
 * pages, which all keep one `mode` in state and hand this the same submit handler.
 *
 * There is deliberately one look. This used to take a "variant" and wear the site-wide
 * .auth-dialog shell everywhere except the jobs routes, so signing in from the home page
 * gave you a 36px heading and a black button while the same dialog on /jobs gave you a
 * compact heading and the blue accent. The .jobs-modal shell won because every other modal
 * in the app already wears it — the post-job form, the choice dialog, the invite dialog. */
export function AuthDialog({ mode, onModeChange, name, onNameChange, email, onEmailChange, password, onPasswordChange, busy, subtitle, onClose, onSubmit }: AuthDialogProps) {
  const formProps = { email, onEmailChange, password, onPasswordChange, busy, submitClassName: "modal-submit", onSubmit };
  const hint = subtitle ?? (mode === "reset" ? RESET_HINT : undefined);

  return <div className="jobs-modal-backdrop" onClick={onClose}>
    <section className="jobs-modal auth-modal" onClick={(event) => event.stopPropagation()}>
      <button className="jobs-modal-close" onClick={onClose} aria-label="Хаах"><Icon name="close" /></button>
      <p className="modal-kicker">Project X account</p>
      <h2>{HEADING[mode]}</h2>
      {hint && <p className="modal-subtitle">{hint}</p>}
      {mode === "signin" && <SignInForm {...formProps} />}
      {mode === "signup" && <SignUpForm {...formProps} name={name} onNameChange={onNameChange} />}
      {mode === "reset" && <ForgotPasswordForm {...formProps} />}
      <div className="auth-switch-row">
        {mode === "signin" && <button type="button" className="auth-switch" onClick={() => onModeChange("reset")}>Нууц үг мартсан уу?</button>}
        <button type="button" className="auth-switch" onClick={() => onModeChange(SWITCH_TO[mode])}>{SWITCH_LABEL[mode]}</button>
      </div>
    </section>
  </div>;
}
