import { Icon } from "../Icon";

type CategoryRailProps = {
  categories: string[];
  categoryArtwork: Record<string, string>;
  activeCategory: string;
  onActiveCategoryChange: (value: string) => void;
};

/** The horizontal category chip rail and "recommended feed" heading below the toolbar. */
export function CategoryRail({ categories, categoryArtwork, activeCategory, onActiveCategoryChange }: CategoryRailProps) {
  return <>
    <div className="topic-rack">{categories.map((category) => <button key={category} className={activeCategory === category ? "topic-card active" : "topic-card"} onClick={() => onActiveCategoryChange(category)} style={{ backgroundImage: `linear-gradient(90deg, rgba(9,12,22,.72), rgba(9,12,22,.18)), url(${categoryArtwork[category]})` }}><span>{category === "Бүгд" ? "Танд" : category}</span></button>)}</div>
    <div className="feed-heading"><h2>Танд санал болгох</h2><button><Icon name="filter" /> Feed-ээ тохируулах</button></div>
  </>;
}
