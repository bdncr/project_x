import { Icon } from "../Icon";
import type { Job } from "../../lib/job-samples";
import { friendlyEmploymentType, friendlyWorkMode, relativeDate } from "../../lib/jobs-data";

type JobDetailPanelProps = {
  loading: boolean;
  selected: Job | undefined;
  applied: boolean;
  saved: boolean;
  onToggleSaved: () => void;
  onOpenApplication: () => void;
};

export function JobDetailPanel({ loading, selected, applied, saved, onToggleSaved, onOpenApplication }: JobDetailPanelProps) {
  if (loading) return <article className="job-detail" aria-live="polite">
    <div className="job-detail-skeleton" aria-hidden="true">
      <div className="job-detail-skeleton-head">
        <span className="job-logo large skeleton" />
        <div className="job-detail-skeleton-head-lines">
          <span className="skeleton skeleton-line" style={{ width: "55%", height: 20 }} />
          <span className="skeleton skeleton-line" style={{ width: "35%" }} />
        </div>
      </div>
      <div className="job-detail-skeleton-body">
        <span className="skeleton job-detail-skeleton-main" />
        <span className="skeleton job-detail-skeleton-side" />
      </div>
    </div>
  </article>;

  if (!selected) return <article className="job-detail" aria-live="polite">
    <div className="job-detail-empty"><Icon name="briefcase" /><h1>Ажлаа сонгоно уу</h1><p>Зүүн талын жагсаалтаас зар сонгоход дэлгэрэнгүй мэдээлэл харагдана.</p></div>
  </article>;

  return <article className="job-detail" aria-live="polite">
    <div className="job-detail-head">
      <span className="job-logo large" style={{ background: selected.companyColor }}>{selected.company.slice(0, 1)}</span>
      <div><p className="job-kicker"><Icon name="clock" />{relativeDate(selected.publishedAt)}</p><h1>{selected.title}</h1><p className="job-company">{selected.company}<span>·</span><Icon name="pin" />{selected.location}<span>·</span>{friendlyWorkMode(selected.workMode)}</p></div>
    </div>
    <div className="job-detail-actions">
      <button className={applied ? "apply applied" : "apply"} onClick={onOpenApplication}>{applied ? "Хүсэлт илгээсэн" : "Хүсэлт илгээх"}</button>
      <button className={saved ? "save-job saved" : "save-job"} onClick={onToggleSaved}><Icon name={saved ? "bookmarkFill" : "bookmark"} />{saved ? "Хадгалсан" : "Хадгалах"}</button>
      <b className="job-salary">{selected.salary}</b>
    </div>
    <div className="job-detail-body">
      <div className="job-description">
        <p className="job-intro">{selected.description}</p>
        <h2>Таны хийх ажил</h2>
        <ul>{selected.responsibilities.length ? selected.responsibilities.map((item) => <li key={item}><Icon name="check" />{item}</li>) : <li><Icon name="check" />Төслийн багтай уялдан чиг үүргээ хэрэгжүүлэх</li>}</ul>
        <h2>Тавигдах шаардлага</h2>
        <ul>{selected.requirements.length ? selected.requirements.map((item) => <li key={item}><Icon name="check" />{item}</li>) : <li><Icon name="check" />Portfolio болон холбогдох туршлагатай байх</li>}</ul>
        <div className="job-apply-card"><div><span><Icon name="spark" />Project X profile</span><h3>Portfolio-оороо онцгой сэтгэгдэл үлдээгээрэй.</h3><p>Хүсэлт илгээхэд таны Project X профайл болон товч танилцуулга ажил олгогчид хүрнэ.</p></div><button className={applied ? "apply applied" : "apply"} onClick={onOpenApplication}>{applied ? "Илгээсэн" : "Одоо хүсэлт илгээх"}<Icon name="arrow" /></button></div>
      </div>
      <aside className="job-facts">
        <div><small>АЖЛЫН ТӨРӨЛ</small><b><Icon name="briefcase" />{friendlyEmploymentType(selected.employmentType)}</b></div>
        <div><small>АЖИЛЛАХ ХЭЛБЭР</small><b>{friendlyWorkMode(selected.workMode)}</b></div>
        <div><small>БАЙРШИЛ</small><b>{selected.location}</b></div>
        <div><small>ХҮСЭЛТ ИРСЭН</small><b>{selected.applicantsCount} хүн</b></div>
        <div><small>ХОЛБОГДОХ ХҮН</small><b>{selected.hiringContact}</b><span>{selected.contactRole}</span></div>
        <div><small>УР ЧАДВАР</small><p>{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</p></div>
      </aside>
    </div>
  </article>;
}
