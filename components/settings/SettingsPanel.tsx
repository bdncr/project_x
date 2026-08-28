"use client";

import type { FormEvent, ReactNode } from "react";

type SettingsPanelProps = {
  title: string;
  description: string;
  busy: boolean;
  submitLabel: string;
  busyLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  /** Rendered under the submit button — used for irreversible actions. */
  footer?: ReactNode;
};

/** Shared card chrome for every settings section, so the four panels only describe
 * their own fields instead of each repeating a heading, form and submit button. */
export function SettingsPanel({ title, description, busy, submitLabel, busyLabel, onSubmit, children, footer }: SettingsPanelProps) {
  return <section className="settings-panel">
    <header className="settings-panel-head">
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
    <form onSubmit={onSubmit}>
      {children}
      <button className="settings-save" disabled={busy} type="submit">{busy ? busyLabel : submitLabel}</button>
    </form>
    {footer}
  </section>;
}
