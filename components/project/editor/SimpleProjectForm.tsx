type SimpleProjectFormProps = {
  summary: string;
  onSummaryChange: (value: string) => void;
};

/** The plain-form fallback: everything the block editor's metadata card already covers
 * (title/role/category/cover/status) stays shared, so this only adds the description. */
export function SimpleProjectForm({ summary, onSummaryChange }: SimpleProjectFormProps) {
  return <label className="wide-field">Тайлбар<textarea value={summary} onChange={(event) => onSummaryChange(event.target.value)} rows={8} placeholder="Төслийнхөө тухай товч бичнэ үү…" /></label>;
}
