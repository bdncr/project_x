import type { FormEvent } from "react";

/** "reset" asks Supabase to mail a recovery link; the link itself lands on /auth/reset. */
export type AuthMode = "signin" | "signup" | "reset";

/** Everything both forms need. Sign-up layers its own `name` field on top of this. */
export type AuthFormProps = {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  busy: boolean;
  /** Submit-button class, handed down by AuthDialog so the forms stay chrome-agnostic. */
  submitClassName: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};
