import { Icon } from "../Icon";
import type { Creator } from "../../lib/creator-samples";

export function ProfileServices({ creator, onMessage }: { creator: Creator; onMessage: () => void }) {
  const offersServices = creator.tags.includes("Үйлчилгээ");

  if (!offersServices) return <div className="empty-state">
    <h3>Үйлчилгээ алга байна</h3>
    <p>{creator.name} одоогоор захиалгат үйлчилгээ нэмээгүй байна.</p>
  </div>;

  return <div className="profile-service-card">
    <span className="profile-service-icon"><Icon name="briefcase" /></span>
    <div>
      <h3>{creator.role} үйлчилгээ</h3>
      <p>{creator.name} захиалгат {creator.category ? creator.category.toLowerCase() + " " : ""}төсөлд хамтран ажиллах боломжтой. Дэлгэрэнгүй үнэ, хугацааг зурвасаар шууд асууж болно.</p>
    </div>
    <button type="button" className="creator-message" onClick={onMessage}>Захиалга өгөх</button>
  </div>;
}
