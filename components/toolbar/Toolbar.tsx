"use client";

import Link from "next/link";
import { Icon } from "../Icon";
import { SearchBox } from "./SearchBox";

type ContentKind = "projects" | "people";

type ToolbarProps<T extends string> = {
  activeKind: ContentKind;
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  sortMode: T;
  onSortModeChange: (value: T) => void;
  sortMenuOpen: boolean;
  onToggleSortMenu: () => void;
  sortOptions: [T, string][];
};

/** The Filter/Search/content-kind/Sort bar shared by the explore and people pages. */
export function Toolbar<T extends string>({ activeKind, query, onQueryChange, searchPlaceholder, sortMode, onSortModeChange, sortMenuOpen, onToggleSortMenu, sortOptions }: ToolbarProps<T>) {
  const sortLabel = sortOptions.find(([value]) => value === sortMode)?.[1] ?? sortOptions[0][1];

  return <div className="toolbar">
    <button className="filter-trigger"><Icon name="filter" /> Шүүлтүүр</button>
    <SearchBox query={query} onQueryChange={onQueryChange} placeholder={searchPlaceholder} />
    <div className="content-kind">
      {activeKind === "projects" ? <button className="active">Төслүүд</button> : <Link href="/">Төслүүд</Link>}
      {activeKind === "people" ? <button className="active">Хүмүүс</button> : <Link href="/people">Хүмүүс</Link>}
      <button disabled>Assets</button>
      <button disabled>Зургууд</button>
    </div>
    <div className="sort-dropdown">
      <button className="sort-selector" onClick={onToggleSortMenu}><Icon name="filter" /><span>{sortLabel}</span><Icon name="chevron" /></button>
      {sortMenuOpen && <div className="sort-menu">{sortOptions.map(([value, label]) => <button key={value} className={sortMode === value ? "active" : ""} onClick={() => onSortModeChange(value)}>{label}</button>)}</div>}
    </div>
  </div>;
}
