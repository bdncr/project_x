"use client";

import type { ReactNode } from "react";

type AuthPageCardProps = {
  title: string;
  children: ReactNode;
};

/** Centred card chrome for the standalone auth routes (/auth/forgot, /auth/reset).
 * These are full pages rather than modal steps because the user arrives at them from an
 * email link, with no dialog open behind them to return to. */
export function AuthPageCard({ title, children }: AuthPageCardProps) {
  return <section className="auth-page">
    <div className="auth-dialog auth-page-card">
      <p className="kicker">Project X account</p>
      <h2>{title}</h2>
      {children}
    </div>
  </section>;
}
