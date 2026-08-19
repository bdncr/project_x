export type ProfileTab = "work" | "services" | "appreciated" | "saved";

const TABS: [ProfileTab, string][] = [
  ["work", "Төслүүд"],
  ["services", "Үйлчилгээ"],
  ["appreciated", "Талархсан"],
];

/** "Хадгалсан" only ever shows for the profile's own owner — project_saves rows are
 * only readable by their owner (see the "Saves are readable to owner" RLS policy),
 * so nobody else could see this list even if the tab were clickable. */
export function ProfileTabs({ active, onChange, showSaved }: { active: ProfileTab; onChange: (tab: ProfileTab) => void; showSaved: boolean }) {
  const tabs = showSaved ? [...TABS, ["saved", "Хадгалсан"] as [ProfileTab, string]] : TABS;
  return <nav className="profile-tabs" aria-label="Профайлын хэсгүүд">
    {tabs.map(([tab, label]) => <button key={tab} type="button" className={tab === active ? "profile-tab active" : "profile-tab"} onClick={() => onChange(tab)}>{label}</button>)}
  </nav>;
}
