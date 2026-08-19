import type { FormEvent } from "react";
import { Icon } from "../Icon";
import { EmploymentType, WorkMode } from "../../lib/job-samples";
import type { JobForm } from "../../lib/jobs-data";

type PostJobFormProps = {
  form: JobForm;
  onFormChange: (form: JobForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  error: string;
};

export function PostJobForm({ form, onFormChange, onSubmit, busy, error }: PostJobFormProps) {
  return <section className="jobs-modal post-modal job-form-card">
    <p className="modal-kicker">Шинэ ажил</p>
    <h2>Ажлын зар байршуулах</h2>
    <p className="modal-subtitle">Бүтээлч мэргэжилтнүүдэд хүрэх ажлын зарыг дэлгэрэнгүй бичээрэй.</p>
    <form onSubmit={onSubmit} className="post-form">
      <label>Ажлын гарчиг<input required value={form.title} onChange={(event) => onFormChange({ ...form, title: event.target.value })} placeholder="Жишээ: UX/UI дизайнер" /></label>
      <label>Байгууллага<input required value={form.company} onChange={(event) => onFormChange({ ...form, company: event.target.value })} placeholder="Танай байгууллагын нэр" /></label>
      <div className="post-form-grid">
        <label>Байршил<input value={form.location} onChange={(event) => onFormChange({ ...form, location: event.target.value })} /></label>
        <label>Цалин / төсөв<input value={form.salary} onChange={(event) => onFormChange({ ...form, salary: event.target.value })} placeholder="₮4.0–6.0 сая / сар" /></label>
        <label>Ажлын төрөл<select value={form.employmentType} onChange={(event) => onFormChange({ ...form, employmentType: event.target.value as EmploymentType })}><option value="full_time">Бүтэн цаг</option><option value="freelance">Freelance</option><option value="contract">Гэрээт</option></select></label>
        <label>Ажиллах хэлбэр<select value={form.workMode} onChange={(event) => onFormChange({ ...form, workMode: event.target.value as WorkMode })}><option value="hybrid">Hybrid</option><option value="remote">Remote</option><option value="on_site">On-site</option></select></label>
      </div>
      <label>Тайлбар<textarea required value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} rows={4} placeholder="Энэ үүргийн зорилго, баг, сонирхолтой боломжийн тухай..." /></label>
      <label>Ур чадвар <span>(мөр тус бүрд нэг)</span><textarea value={form.skills} onChange={(event) => onFormChange({ ...form, skills: event.target.value })} rows={3} placeholder={"Figma\nUX Research\nDesign systems"} /></label>
      <label>Хийх ажил <span>(мөр тус бүрд нэг)</span><textarea value={form.responsibilities} onChange={(event) => onFormChange({ ...form, responsibilities: event.target.value })} rows={3} placeholder={"User flow боловсруулах\nDesign system өргөжүүлэх"} /></label>
      <label>Шаардлага <span>(мөр тус бүрд нэг)</span><textarea value={form.requirements} onChange={(event) => onFormChange({ ...form, requirements: event.target.value })} rows={3} placeholder={"2+ жилийн туршлагатай\nPortfolio илгээх"} /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="modal-submit" disabled={busy} type="submit">{busy ? "Нийтэлж байна…" : "Ажлын зар нийтлэх"}<Icon name="arrow" /></button>
    </form>
  </section>;
}
