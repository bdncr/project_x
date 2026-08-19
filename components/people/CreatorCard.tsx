import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "../Icon";
import { Creator, TAG_CLASS } from "../../lib/creator-samples";
import { compactNumber } from "../../lib/format";

type CreatorCardProps = {
  creator: Creator;
  following: boolean;
  followerDelta: number;
  onToggleFollow: (creator: Creator) => void;
  onMessage: (creator: Creator) => void;
};

export function CreatorCard({ creator, following, followerDelta, onToggleFollow, onMessage }: CreatorCardProps) {
  const router = useRouter();
  const profileHref = `/profile/${encodeURIComponent(creator.id)}`;
  const firstName = creator.name.split(" ")[0];
  const thumbs = [...creator.thumbnails, ...Array(Math.max(0, 4 - creator.thumbnails.length)).fill(null)].slice(0, 4);

  // The whole card navigates to the profile page; the two action buttons stop
  // propagation so clicking Follow/Message doesn't also trigger navigation.
  const goToProfile = () => router.push(profileHref);
  const stopAnd = (handler: () => void) => (event: { stopPropagation: () => void }) => { event.stopPropagation(); handler(); };

  return <article className="creator-card" onClick={goToProfile} role="link" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") goToProfile(); }}>
    <div className="creator-thumbs">
      <div className="creator-thumbs-row">
        {thumbs.map((src, index) => src ? <img key={index} src={src} alt="" /> : <span key={index} className="creator-thumb-empty" />)}
      </div>
      <span className="creator-avatar-wrap">
        <span className="account-avatar creator-avatar">{creator.name.slice(0, 1).toUpperCase()}</span>
        {creator.isPro && <b className="creator-pro">PRO</b>}
      </span>
    </div>
    <div className="creator-body">
      <h3><Link href={profileHref} onClick={(event) => event.stopPropagation()}>{creator.name}</Link></h3>
      <p className="creator-location"><Icon name="pin" />{creator.location}</p>
      {creator.tags.length > 0 && <div className="creator-tags">{creator.tags.map((tag) => <span key={tag} className={TAG_CLASS[tag] ?? ""}>{tag}</span>)}</div>}

      <div className="creator-actions">
        <div className="creator-stats">
        <div><b>{compactNumber(creator.appreciations)}</b><span>Талархал</span></div>
        <div><b>{compactNumber(Math.max(0, creator.followers + followerDelta))}</b><span>Дагагч</span></div>
        <div><b>{compactNumber(creator.projectViews)}</b><span>Үзэлт</span></div>
      </div>
        <button type="button" className={following ? "creator-follow following" : "creator-follow"} onClick={stopAnd(() => onToggleFollow(creator))}>{following ? "Дагасан" : "Дагах"}</button>
        <button type="button" className="creator-message" onClick={stopAnd(() => onMessage(creator))}>{firstName}-д зурвас бичих</button>
      </div>
    </div>
  </article>;
}
