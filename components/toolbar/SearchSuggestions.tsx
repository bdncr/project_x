"use client";

import { Icon } from "../Icon";

type SearchSuggestionsProps = {
  /** Terms this visitor has searched before, most recent first. Empty on a fresh browser. */
  history: string[];
  suggestions: string[];
  onPick: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
};

/** The panel under the search field. Shows the visitor's own recent searches once they have
 * any, and falls back to a suggested set so a first-time focus still has something in it. */
export function SearchSuggestions({ history, suggestions, onPick, onRemove, onClear }: SearchSuggestionsProps) {
  const showingHistory = history.length > 0;
  const terms = showingHistory ? history : suggestions;

  return <div className="search-suggestions" role="listbox" aria-label={showingHistory ? "Сүүлд хайсан" : "Санал болгох хайлт"}>
    <div className="search-suggestions-head">
      <span>{showingHistory ? "Сүүлд хайсан" : "Санал болгох хайлт"}</span>
      {showingHistory && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={onClear}>Цэвэрлэх</button>}
    </div>
    {terms.map((term) => (
      <div className="search-suggestion-row" key={term}>
        {/* onMouseDown is preventDefault'd throughout: the field must not blur before the
            click lands, or the panel unmounts and the click never reaches its target. */}
        <button
          type="button"
          role="option"
          aria-selected={false}
          className="search-suggestion"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(term)}
        >
          <Icon name={showingHistory ? "clock" : "search"} />
          <span className="search-suggestion-term">{term}</span>
        </button>
        {showingHistory && <button
          type="button"
          className="search-suggestion-remove"
          aria-label={`${term} — түүхээс хасах`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onRemove(term)}
        ><Icon name="close" /></button>}
      </div>
    ))}
  </div>;
}
