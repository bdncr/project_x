import { Icon } from "../Icon";
import type { Job, WorkMode } from "../../lib/job-samples";
import { friendlyEmploymentType } from "../../lib/jobs-data";

type JobsSidebarProps = {
  loading: boolean;
  jobs: Job[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  workMode: "all" | WorkMode;
  onWorkModeChange: (value: "all" | WorkMode) => void;
};

/** The left workspace column: result count, search, work-mode filters, and the scrollable job list. */
export function JobsSidebar({ loading, jobs, selectedId, onSelect, search, onSearchChange, workMode, onWorkModeChange }: JobsSidebarProps) {
  return <aside className="jobs-list" aria-label="Ажлын жагсаалт">
    <div className="jobs-list-tools">
      <div><strong>{loading ? "…" : jobs.length}</strong><span>ажлын санал</span></div>
      <label className="jobs-search"><Icon name="search" /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Ажил, ур чадвар хайх" /></label>
    </div>
    <div className="jobs-filter-row">
      <button className={workMode === "all" ? "active" : ""} onClick={() => onWorkModeChange("all")}>Бүгд</button>
      <button className={workMode === "remote" ? "active" : ""} onClick={() => onWorkModeChange("remote")}>Remote</button>
      <button className={workMode === "hybrid" ? "active" : ""} onClick={() => onWorkModeChange("hybrid")}>Hybrid</button>
      <button className={workMode === "on_site" ? "active" : ""} onClick={() => onWorkModeChange("on_site")}>On-site</button>
    </div>
    <div className="jobs-scroll-list">
      {loading ? Array.from({ length: 7 }).map((_, index) => <div key={index} className="job-list-item skeleton-row" aria-hidden="true">
        <span className="job-logo skeleton" />
        <span className="job-list-copy">
          <span className="skeleton skeleton-line" style={{ width: "78%", height: 11 }} />
          <span className="skeleton skeleton-line" style={{ width: "50%", marginTop: 8 }} />
          <span className="job-list-meta"><span className="skeleton skeleton-line" style={{ width: 60, height: 14, borderRadius: 8, marginTop: 9 }} /></span>
        </span>
      </div>) : jobs.map((job) => <button key={job.id} className={selectedId === job.id ? "job-list-item selected" : "job-list-item"} onClick={() => onSelect(job.id)}>
        <span className="job-logo" style={{ background: job.companyColor }}>{job.company.slice(0, 1)}</span>
        <span className="job-list-copy"><strong>{job.title}</strong><small>{job.company} · {job.location}</small><span className="job-list-meta"><em className={job.employmentType}>{friendlyEmploymentType(job.employmentType)}</em><b>{job.salary}</b></span></span>
        <span className="job-more"><Icon name="more" /></span>
      </button>)}
      {!loading && jobs.length === 0 && <div className="jobs-empty"><Icon name="search" /><strong>Ажил олдсонгүй</strong><p>Хайлт эсвэл шүүлтүүрээ өөрчилж үзнэ үү.</p></div>}
    </div>
  </aside>;
}
