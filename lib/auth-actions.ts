import type { AuthMode } from "../components/auth/types";
import { supabase } from "./supabase";

export type AuthSubmitInput = {
  mode: AuthMode;
  email: string;
  password: string;
  displayName: string;
};

/** Outcome of one auth submission. `message` goes straight to the page's toast and
 * `close` says whether the dialog should dismiss, so all seven pages that host
 * AuthDialog react identically instead of each re-deciding (they had drifted apart). */
const NO_BACKEND_MESSAGE = "Demo горимд нэвтрэх шаардлагагүй.";

export type AuthSubmitResult = {
  message: string;
  close: boolean;
};

/** Where Supabase sends the recovery link. This exact URL must also be listed under
 * Authentication > URL Configuration > Redirect URLs in the Supabase dashboard, or the
 * link bounces to the site root without a token. */
export function passwordResetRedirectUrl(): string {
  return `${window.location.origin}/auth/reset`;
}

export type PasswordResetRequest = {
  ok: boolean;
  message: string;
};

/** Asks Supabase to mail a recovery link. Shared by the auth dialog's "reset" mode and the
 * standalone /auth/forgot page so both word the outcome identically. */
export async function sendPasswordResetLink(email: string): Promise<PasswordResetRequest> {
  if (!supabase) return { ok: false, message: NO_BACKEND_MESSAGE };
  const address = email.trim();
  if (!address) return { ok: false, message: "Имэйл хаягаа оруулна уу." };
  const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo: passwordResetRedirectUrl() });
  if (error) return { ok: false, message: error.message };
  // Same wording whether or not the address has an account — anything else would let a
  // stranger use this form to test which emails are registered here.
  return { ok: true, message: "Хэрэв энэ хаяг бүртгэлтэй бол сэргээх холбоос илгээгдлээ." };
}

export async function runAuthSubmit({ mode, email, password, displayName }: AuthSubmitInput): Promise<AuthSubmitResult> {
  if (!supabase) return { message: NO_BACKEND_MESSAGE, close: true };

  if (mode === "reset") {
    const result = await sendPasswordResetLink(email);
    return { message: result.message, close: result.ok };
  }

  const response = mode === "signin"
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName.trim() } } });

  if (response.error) return { message: response.error.message, close: false };
  if (mode === "signup" && !response.data.session) return { message: "Баталгаажуулах имэйлээ шалгаад нэвтэрнэ үү.", close: true };
  return { message: mode === "signin" ? "Амжилттай нэвтэрлээ." : "Бүртгэл амжилттай үүслээ.", close: true };
}
