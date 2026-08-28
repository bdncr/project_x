"use client";

import type { FormEvent } from "react";
import { Icon } from "../Icon";
import { SELECTABLE_EMPLOYMENT_TAGS } from "../../lib/creator-samples";



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
            {SELECTABLE_EMPLOYMENT_TAGS.map((tag) => <label key={tag} className="edit-profile-tag-option">
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
