import { Icon } from "../Icon";

export type JobsTab = "for_you" | "freelance" | "full_time" | "saved" | "applied";

const TABS: { id: JobsTab; label: string; badge?: string }[] = [
  { id: "for_you", label: "Танд тохирох" },
  { id: "freelance", label: "Freelance", badge: "PRO" },
  { id: "full_time", label: "Бүтэн цаг" },
  { id: "saved", label: "Хадгалсан" },
  { id: "applied", label: "Илгээсэн" },
];

type JobsTabsProps = {
  tab: JobsTab;
  onTabChange: (tab: JobsTab) => void;
  savedCount: number;
  appliedCount: number;
  onNewJob: () => void;
};

export function JobsTabs({ tab, onTabChange, savedCount, appliedCount, onNewJob }: JobsTabsProps) {
  return <div className="jobs-tabs" role="tablist" aria-label="Ажлын төрлүүд">
    <div className="jobs-tabs-scroll">
      {TABS.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? "active" : ""} onClick={() => onTabChange(item.id)}>
        {item.label}
        {item.badge && <b>{item.badge}</b>}
        {item.id === "saved" && savedCount > 0 && <i>{savedCount}</i>}
        {item.id === "applied" && appliedCount > 0 && <i>{appliedCount}</i>}
      </button>)}
    </div>
    <button type="button" className="apply new-job-btn" onClick={onNewJob}><Icon name="plus" /><span>Шинэ ажил</span></button>
  </div>;
}
