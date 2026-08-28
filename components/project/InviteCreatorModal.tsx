"use client";

import { FormEvent, useState } from "react";
import { Icon } from "../Icon";
import { PROJECT_CATEGORIES } from "../../lib/project-crud";
import { BUDGET_OPTIONS, InviteErrors, InviteForm, MAX_INVITE_CATEGORIES, emptyInviteForm, validateInvite } from "../../lib/invite-job";

type InviteCreatorModalProps = {
  creatorName: string;
  creatorInitial: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (form: InviteForm) => void;
};

/** "Ажлын санал" — the commission brief sent to a project's creator. Scrolls in its body with
 * the submit pinned to the bottom, so the primary action stays reachable on a short window. */
export function InviteCreatorModal({ creatorName, creatorInitial, busy, onClose, onSubmit }: InviteCreatorModalProps) {
  const [form, setForm] = useState<InviteForm>(emptyInviteForm);
  const [errors, setErrors] = useState<InviteErrors>({});

  const set = <K extends keyof InviteForm>(key: K, value: InviteForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  function toggleCategory(category: string) {
    setForm((current) => {
      if (current.categories.includes(category)) return { ...current, categories: current.categories.filter((entry) => entry !== category) };
      if (current.categories.length >= MAX_INVITE_CATEGORIES) return current;
      return { ...current, categories: [...current.categories, category] };
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateInvite(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit(form);
  }

  return <div className="jobs-modal-backdrop" onClick={onClose}>
    <section className="jobs-modal invite-modal" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="jobs-modal-close" onClick={onClose} aria-label="Хаах"><Icon name="close" /></button>

      <header className="invite-head">
        <span className="account-avatar invite-head-avatar">{creatorInitial}</span>
        <h2>{creatorName}-д ажлын санал</h2>
      </header>

      <form className="invite-form" onSubmit={submit}>
        <div className="invite-body">
          <label className="invite-field">
            <span className="invite-label">Ямар ажил санал болгох вэ?</span>
            <input
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="Номын зураглал, шинэ стартапын лого гэх мэт"
              aria-invalid={!!errors.title}
              className={errors.title ? "invite-input-error" : undefined}
            />
            {errors.title && <em className="invite-error">{errors.title}</em>}
          </label>

          <div className="invite-field">
            <span className="invite-label">Ангилал <b>({form.categories.length}/{MAX_INVITE_CATEGORIES})</b></span>
            {/* A chip set rather than the reference's dropdown: the choice is short, capped at
                three, and a multi-select <select> is unusable on touch. */}
            <div className="invite-chips">
              {PROJECT_CATEGORIES.map((category) => {
                const active = form.categories.includes(category);
                return <button
                  key={category}
                  type="button"
                  className={active ? "invite-chip active" : "invite-chip"}
                  aria-pressed={active}
                  disabled={!active && form.categories.length >= MAX_INVITE_CATEGORIES}
                  onClick={() => toggleCategory(category)}
                >{category}</button>;
              })}
            </div>
          </div>

          <div className="invite-field">
            <span className="invite-label">Таны төсөв хэд вэ?</span>
            <div className="invite-budgets">
              {BUDGET_OPTIONS.map((option) => <label key={option} className="invite-radio">
                <input type="radio" name="invite-budget" checked={form.budget === option} onChange={() => set("budget", option)} />
                <span>{option}</span>
              </label>)}
            </div>
          </div>

          <label className="invite-field">
            <span className="invite-label">Ажлын тайлбар</span>
            <textarea
              rows={5}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              placeholder={"- Ажлын товч тойм\n- Хүлээгдэж буй үр дүн\n- Тохирох хугацаа\n- гэх мэт"}
            />
          </label>

          <label className="invite-field">
            <span className="invite-label">{creatorName}-д хувийн захиас</span>
            <textarea rows={3} value={form.note} onChange={(event) => set("note", event.target.value)} />
          </label>

          <div className="invite-field">
            <span className="invite-label">Хэний нэрийн өмнөөс:</span>
            <div className="invite-who">
              <label className={form.hiringFor === "personal" ? "invite-who-card active" : "invite-who-card"}>
                <input type="radio" name="invite-hiring-for" checked={form.hiringFor === "personal"} onChange={() => set("hiringFor", "personal")} />
                <span>Хувийн төсөл</span>
              </label>
              <label className={form.hiringFor === "company" ? "invite-who-card active" : "invite-who-card"}>
                <input type="radio" name="invite-hiring-for" checked={form.hiringFor === "company"} onChange={() => set("hiringFor", "company")} />
                <span>Байгууллага</span>
              </label>
            </div>
          </div>

          {form.hiringFor === "company" && <div className="invite-company">
            <div className="invite-company-logo">
              {form.companyLogoUrl.trim()
                ? <img src={form.companyLogoUrl} alt="" />
                : <Icon name="image" />}
            </div>
            <div className="invite-company-fields">
              <input
                value={form.companyName}
                onChange={(event) => set("companyName", event.target.value)}
                placeholder="Байгууллагын нэр"
                aria-invalid={!!errors.company}
                className={errors.company ? "invite-input-error" : undefined}
              />
              {errors.company && <em className="invite-error">{errors.company}</em>}
              <div className="invite-prefixed">
                <span>https://</span>
                <input value={form.companyWebsite} onChange={(event) => set("companyWebsite", event.target.value)} placeholder="Вэб хаяг" />
              </div>
              {/* A URL rather than a file picker: this app has no storage bucket, and every
                  other image in it (covers, blocks, avatars) is referenced the same way. */}
              <input value={form.companyLogoUrl} onChange={(event) => set("companyLogoUrl", event.target.value)} placeholder="Логоны зургийн холбоос" />
            </div>
          </div>}
        </div>

        <footer className="invite-foot">
          <button type="submit" className="invite-submit" disabled={busy}>
            {busy ? "Илгээж байна…" : "Санал илгээх"}
          </button>
        </footer>
      </form>
    </section>
  </div>;
}
