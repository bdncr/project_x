import type { Creator } from "../../lib/creator-samples";
import { CreatorCard } from "./CreatorCard";

type CreatorGridProps = {
  loading: boolean;
  creators: Creator[];
  followedIds: string[];
  followerDeltas: Record<string, number>;
  onToggleFollow: (creator: Creator) => void;
  onMessage: (creator: Creator) => void;
};

export function CreatorGrid({ loading, creators, followedIds, followerDeltas, onToggleFollow, onMessage }: CreatorGridProps) {
  if (loading) return <div className="creator-grid">
    {Array.from({ length: 8 }).map((_, index) => <article className="creator-card" key={index} aria-hidden="true">
      <span className="creator-thumbs skeleton" />
      <div className="creator-body">
        <span className="skeleton skeleton-line" style={{ width: "60%", height: 14, margin: "44px auto 0" }} />
        <span className="skeleton skeleton-line" style={{ width: "40%", height: 10, margin: "10px auto 0" }} />
      </div>
    </article>)}
  </div>;

  if (creators.length === 0) return <div className="empty-state"><h3>Хэрэглэгч олдсонгүй</h3><p>Хайлт эсвэл шүүлтүүрээ өөрчилж үзнэ үү.</p></div>;

  return <div className="creator-grid">{creators.map((creator) => <CreatorCard key={creator.id} creator={creator} following={followedIds.includes(creator.id)} followerDelta={followerDeltas[creator.id] ?? 0} onToggleFollow={onToggleFollow} onMessage={onMessage} />)}</div>;
}
