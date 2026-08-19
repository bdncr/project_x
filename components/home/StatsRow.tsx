type StatsRowProps = { total: number; published: number; drafts: number; saved: number };

export function StatsRow({ total, published, drafts, saved }: StatsRowProps) {
  return <section className="stats-row">
    <div><span>{total}</span><p>Миний бүтээл</p></div>
    <div><span>{published}</span><p>Нийтлэгдсэн</p></div>
    <div><span>{drafts}</span><p>Ноорог</p></div>
    <div><span>{saved}</span><p>Хадгалсан</p></div>
  </section>;
}
