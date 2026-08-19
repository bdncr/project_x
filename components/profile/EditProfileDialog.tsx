"use client";

import type { FormEvent } from "react";
import { Icon } from "../Icon";

/** The one status pill a creator can't self-assign — "Онцлох" is awarded by the
 * platform (top-follower creator), not chosen, so it's excluded from this list. */
const STATUS_OPTIONS = ["Freelance", "Бүтэн цаг", "Үйлчилгээ"];

type EditProfileDialogProps = {
  headline: string;
  onHeadlineChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  employmentTags: string[];
  onToggleTag: (tag: string) => void;
  busy: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EditProfileDialog({ headline, onHeadlineChange, location, onLocationChange, employmentTags, onToggleTag, busy, onClose, onSubmit }: EditProfileDialogProps) {
  return <div className="modal-backdrop" onClick={onClose}>
    <section className="auth-dialog edit-profile-dialog" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose}><Icon name="close" /></button>
      <p className="kicker">Профайл</p>
      <h2>Профайл засах</h2>
      <form onSubmit={onSubmit}>
        <label>Мэргэжил / ажлын байдал<input value={headline} onChange={(event) => onHeadlineChange(event.target.value)} placeholder="Жишээ: Brand Designer" /></label>
        <label>Байршил<input value={location} onChange={(event) => onLocationChange(event.target.value)} placeholder="Улаанбаатар" /></label>
        <div className="edit-profile-tags">
          <span>Ажлын төлөв</span>
          <div className="edit-profile-tag-options">
            {STATUS_OPTIONS.map((tag) => <label key={tag} className="edit-profile-tag-option">
              <input type="checkbox" checked={employmentTags.includes(tag)} onChange={() => onToggleTag(tag)} />
              {tag}
            </label>)}
          </div>
        </div>
        <button className="auth-submit" disabled={busy} type="submit">{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
      </form>
    </section>
  </div>;
}
