"use client";

import { SETTINGS_SECTIONS, SettingsSection } from "./types";

type SettingsNavProps = {
  active: SettingsSection;
  onChange: (section: SettingsSection) => void;
};

export function SettingsNav({ active, onChange }: SettingsNavProps) {
  return <nav className="settings-nav" aria-label="Тохиргооны хэсгүүд">
    {SETTINGS_SECTIONS.map(([section, label, hint]) => (
      <button
        key={section}
        type="button"
        className={section === active ? "settings-nav-item active" : "settings-nav-item"}
        aria-current={section === active}
        onClick={() => onChange(section)}
      >
        <strong>{label}</strong>
        <small>{hint}</small>
      </button>
    ))}
  </nav>;
}
