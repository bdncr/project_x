import type { Creator } from "../../lib/creator-samples";
import { toolsForCategory } from "../../lib/project-samples";
import { compactNumber, formatDate } from "../../lib/format";

export function ProfileAbout({ creator, joinedAt }: { creator: Creator; joinedAt?: string }) {
  const tools = toolsForCategory(creator.category);
  const status = creator.tags.find((tag) => tag !== "Онцлох");

  return <div className="profile-about">
    <section>
      <h3>Товч танилцуулга</h3>
      <p>
        {creator.name} нь {creator.location} хотод суурьшсан {creator.role.toLowerCase()}.
        {creator.projectCount > 0 ? ` Одоогоор ${creator.projectCount} төсөл нийтэлж, ${compactNumber(creator.appreciations)} талархал хүлээн авсан.` : " Одоогоор нийтэлсэн төсөл алга байна."}
        {status ? ` Тэрээр ${status.toLowerCase()} хэлбэрээр ажилладаг.` : ""}
      </p>
    </section>

    {creator.category && <section>
      <h3>Ур чадвар, хэрэгсэл</h3>
      <div className="case-plain-tags">{tools.map((tool) => <span key={tool}>{tool}</span>)}</div>
    </section>}

    <section>
      <h3>Мэдээлэл</h3>
      <dl className="profile-facts">
        <div><dt>Байршил</dt><dd>{creator.location}</dd></div>
        <div><dt>Төлөв</dt><dd>{status ?? "Тодорхойгүй"}</dd></div>
        <div><dt>Нийтэлсэн төсөл</dt><dd>{creator.projectCount}</dd></div>
        {joinedAt && <div><dt>Элссэн огноо</dt><dd>{formatDate(joinedAt)}</dd></div>}
      </dl>
    </section>
  </div>;
}
