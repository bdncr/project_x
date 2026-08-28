"use client";

import { FormEvent, useState } from "react";
import { Icon } from "../../Icon";
import { LICENSE_OPTIONS, MAX_TAGS, ProjectVisibility } from "../../../lib/project-editor";

type SettingsModalProps = {
  coverUrl: string; onCoverUrlChange: (value: string) => void;
  role: string; onRoleChange: (value: string) => void;
  category: string; onCategoryChange: (value: string) => void;
  categories: string[];
  tags: string[]; onTagsChange: (tags: string[]) => void;
  visibility: ProjectVisibility; onVisibilityChange: (value: ProjectVisibility) => void;
  isMature: boolean; onIsMatureChange: (value: boolean) => void;
  description: string; onDescriptionChange: (value: string) => void;
  license: string; onLicenseChange: (value: string) => void;
  commentsDisabled: boolean; onCommentsDisabledChange: (value: boolean) => void;
  busy: boolean;
  onClose: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
};

/** The reference editor's big two-column Settings dialog — cover on the left, project
 * info + an "Additional Details" accordion on the right. Reuses the .modal-backdrop /
 * .auth-dialog shell already established by AuthDialog/EditProfileDialog, widened via
 * .settings-modal. Team (co-owners/companies/credits) is intentionally left out: it
 * needs real cross-user invite relations, not just extra columns — same call as skipping
 * Work Experience on the profile page earlier this session. */
export function SettingsModal({
  coverUrl, onCoverUrlChange, role, onRoleChange, category, onCategoryChange, categories,
  tags, onTagsChange, visibility, onVisibilityChange, isMature, onIsMatureChange,
  description, onDescriptionChange, license, onLicenseChange, commentsDisabled, onCommentsDisabledChange,
  busy, onClose, onSaveDraft, onPublish,
}: SettingsModalProps) {
  const [tagDraft, setTagDraft] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(true);

  function addTag(event: FormEvent) {
    event.preventDefault();
    const value = tagDraft.trim();
    if (!value || tags.length >= MAX_TAGS) return;
    if (tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) { setTagDraft(""); return; }
    onTagsChange([...tags, value]);
    setTagDraft("");
  }
  function removeTag(tag: string) {
    onTagsChange(tags.filter((item) => item !== tag));
  }

  return <div className="modal-backdrop" onClick={onClose}>
    <section className="auth-dialog settings-modal" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="modal-close" aria-label="Хаах" onClick={onClose}><Icon name="close" /></button>
      <div className="settings-modal-scroll">
      <p className="kicker">Төсөл</p>
      <h2>Тохиргоо</h2>

      <div className="settings-modal-body">
        <div className="settings-cover-col">
          <h3>Төслийн нүүр зураг <span className="settings-required">(заавал)</span></h3>
          <div className="settings-cover-box">
            {coverUrl ? <img src={coverUrl} alt="" /> : <div className="settings-cover-empty"><Icon name="image" /><span>Доор зургийн холбоосоо оруулна уу</span></div>}
          </div>
          <input value={coverUrl} onChange={(event) => onCoverUrlChange(event.target.value)} placeholder="https://... зургийн холбоос" />
          <p className="settings-cover-hint">Санал болгох хэмжээ дор хаяж 1600 × 900px</p>
        </div>

        <div className="settings-fields-col">
          <h3 className="settings-section-title">Төслийн мэдээлэл</h3>

          <label className="settings-field">Төрөл <span className="settings-required">(заавал)</span>
            <input value={role} onChange={(event) => onRoleChange(event.target.value)} placeholder="Жишээ: Brand Designer" />
          </label>

          <div className="settings-field">
            <span>Ангилал <span className="settings-required">(заавал)</span></span>
            <div className="settings-chip-row">
              {categories.map((item) => <button key={item} type="button" className={item === category ? "settings-chip active" : "settings-chip"} onClick={() => onCategoryChange(item)}>{item}</button>)}
            </div>
          </div>

          <div className="settings-field">
            <span>Шошго <small>(дээд тал нь {MAX_TAGS})</small></span>
            <form className="settings-tag-input" onSubmit={addTag}>
              <input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="Шошго бичээд Enter дарна уу" disabled={tags.length >= MAX_TAGS} />
              <button type="submit" disabled={!tagDraft.trim() || tags.length >= MAX_TAGS} aria-label="Шошго нэмэх"><Icon name="plus" /></button>
            </form>
            {tags.length > 0 && <div className="settings-tag-list">
              {tags.map((tag) => <span key={tag} className="settings-tag-chip">{tag}<button type="button" onClick={() => removeTag(tag)} aria-label={`${tag} устгах`}><Icon name="close" /></button></span>)}
            </div>}
          </div>

          <div className="settings-field">
            <span>Харагдац <span className="settings-required">(заавал)</span></span>
            <div className="settings-visibility-options">
              <label className="settings-visibility-option">
                <input type="radio" name="visibility" checked={visibility === "everyone"} onChange={() => onVisibilityChange("everyone")} />
                <div><strong>Нээлттэй</strong><span>Хэн бүхэнд харагдана, хайлтад олдоно</span></div>
              </label>
              <label className="settings-visibility-option">
                <input type="radio" name="visibility" checked={visibility === "private"} onChange={() => onVisibilityChange("private")} />
                <div><strong>Хувийн</strong><span>Зөвхөн танд харагдана. Нийтэлсэн ч бусдад ил гарахгүй.</span></div>
              </label>
              <label className="settings-visibility-option disabled">
                <input type="radio" disabled />
                <div><strong>Нууц үгтэй <span className="settings-pro-badge">PRO</span></strong><span>Зөвхөн нууц үгтэй хүн үзнэ</span></div>
              </label>
              <label className="settings-visibility-option disabled">
                <input type="radio" disabled />
                <div><strong>Зөвхөн холбоосоор <span className="settings-pro-badge">PRO</span></strong><span>Онцгой холбоосоор хуваалцана</span></div>
              </label>
            </div>
          </div>

          <label className="settings-checkbox-row">
            <input type="checkbox" checked={isMature} onChange={(event) => onIsMatureChange(event.target.checked)} />
            <span>Энэ төсөл насанд хүрэгчдэд зориулсан контент агуулна</span>
          </label>

          <div className="settings-accordion">
            <button type="button" className="settings-accordion-trigger" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}>
              <span>Нэмэлт дэлгэрэнгүй</span>
              <span className={detailsOpen ? "settings-accordion-chevron open" : "settings-accordion-chevron"}><Icon name="chevronUp" /></span>
            </button>
            {detailsOpen && <div className="settings-accordion-body">
              <label className="settings-field">Тайлбар
                <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} rows={4} placeholder="Төслийнхөө тухай товч бичнэ үү…" />
              </label>
              <label className="settings-field">Зохиогчийн эрх
                <select value={license} onChange={(event) => onLicenseChange(event.target.value)}>
                  {LICENSE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="settings-checkbox-row">
                <input type="checkbox" checked={commentsDisabled} onChange={(event) => onCommentsDisabledChange(event.target.checked)} />
                <span>Энэ төсөлд сэтгэгдэл бичихийг хаах</span>
              </label>
              <div className="sidebar-advanced-row settings-schedule-row">
                <Icon name="clock" />
                <div><strong>Хуваарьт нийтлэл <span className="settings-pro-badge">PRO</span></strong><span>Нийтлэх огноо, цагаа урьдчилан тохируулах</span></div>
              </div>
            </div>}
          </div>
        </div>
      </div>
      </div>

      <div className="settings-modal-actions">
        <button type="button" className="settings-cancel" onClick={onClose}>Хаах</button>
        <div className="settings-modal-actions-right">
          <button type="button" className="editor-draft-btn" disabled={busy} onClick={onSaveDraft}>Ноорог хадгалах</button>
          <button type="button" className="editor-publish-btn" disabled={busy} onClick={onPublish}>{busy ? "Хадгалж байна…" : "Нийтлэх"}</button>
        </div>
      </div>
    </section>
  </div>;
}
