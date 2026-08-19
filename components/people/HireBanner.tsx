import Link from "next/link";
import type { Creator } from "../../lib/creator-samples";

export function HireBanner({ featured }: { featured?: Creator }) {
  return <section className="hire-banner">
    <div className="hire-banner-copy">
      <h2>Ажилтан хайж байна уу?</h2>
      <p>Бүтэн цаг болон гэрээт ажилд зориулсан мянга гаруй бүтээлч Project X дээр байна.</p>
      <Link href="/hire/jobs/create" className="hero-button">Одоо хайж эхлэх</Link>
    </div>
    {featured && <Link href={`/profile/${encodeURIComponent(featured.id)}`} className="hire-banner-person">
      <span className="account-avatar">{featured.name.slice(0, 1).toUpperCase()}</span>
      <div><strong>{featured.name}</strong><span>{featured.location}</span></div>
    </Link>}
  </section>;
}
