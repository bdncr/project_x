"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { SearchSuggestions } from "./SearchSuggestions";
import { SUGGESTED_SEARCHES, addSearchTerm, clearSearchHistory, readSearchHistory, removeSearchTerm } from "../../lib/search-history";

type SearchBoxProps = {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
};

/** Search field plus its history dropdown. The field stays controlled by the page (typing
 * filters the grid live); the panel only records terms the visitor deliberately commits,
 * by pressing Enter or picking an entry — otherwise every keystroke would become history. */
export function SearchBox({ query, onQueryChange, placeholder }: SearchBoxProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Read on mount rather than in a useState initialiser: this renders on the server too,
  // where window does not exist.
  useEffect(() => { setHistory(readSearchHistory()); }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const commit = (term: string) => {
    setHistory(addSearchTerm(term));
    setOpen(false);
  };

  return <div className="search-field" ref={wrapRef}>
    <label className={open ? "search-box open" : "search-box"}>
      <Icon name="search" />
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={() => setOpen(true)}
        // Enter closes the panel but leaves the field focused, so a later click fires no
        // focus event — without this the panel could not be reopened without blurring first.
        onClick={() => setOpen(true)}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commit(query); } }}
        placeholder={placeholder}
        aria-expanded={open}
      />
      {query && <button
        type="button"
        className="search-clear"
        aria-label="Хайлтыг арилгах"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onQueryChange("")}
      ><Icon name="close" /></button>}
    </label>
    {open && <SearchSuggestions
      history={history}
      suggestions={SUGGESTED_SEARCHES}
      onPick={(term) => { onQueryChange(term); commit(term); }}
      onRemove={(term) => setHistory(removeSearchTerm(term))}
      onClear={() => setHistory(clearSearchHistory())}
    />}
  </div>;
}
