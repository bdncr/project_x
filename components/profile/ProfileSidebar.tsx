import { Icon } from "../Icon";
import { Avatar } from "../Avatar";
import { Creator, TAG_CLASS } from "../../lib/creator-samples";
import { compactNumber } from "../../lib/format";
import { ProfileAbout } from "./ProfileAbout";

type ProfileSidebarProps = {
  creator: Creator;
  isSelf: boolean;
  following: boolean;
  joinedAt?: string;
  onToggleFollow: () => void;
  onMessage: () => void;
  onEditProfile: () => void;
};

export function ProfileSidebar({ creator, isSelf, following, joinedAt, onToggleFollow, onMessage, onEditProfile }: ProfileSidebarProps) {
  return <aside className="profile-sidebar">
    <div className="profile-avatar-wrap">
      <Avatar url={creator.avatarUrl} initial={creator.name.slice(0, 1).toUpperCase()} className="profile-avatar" />
      {creator.isPro && <b className="creator-pro profile-pro">PRO</b>}
    </div>
    <h1>{creator.name}</h1>
    <p className="profile-role">{creator.role}</p>
    <p className="creator-location"><Icon name="pin" />{creator.location}</p>
    {creator.tags.length > 0 && <div className="creator-tags">{creator.tags.map((tag) => <span key={tag} className={TAG_CLASS[tag] ?? ""}>{tag}</span>)}</div>}

    <div className="creator-stats">
      <div><b>{compactNumber(creator.appreciations)}</b><span>Талархал</span></div>
      <div><b>{compactNumber(creator.followers)}</b><span>Дагагч</span></div>
      <div><b>{compactNumber(creator.projectViews)}</b><span>Үзэлт</span></div>
    </div>

    {isSelf
      ? <button type="button" className="creator-follow profile-edit-btn" onClick={onEditProfile}><Icon name="edit" />Профайл засах</button>
      : <div className="creator-actions profile-actions">
          <button type="button" className={following ? "creator-follow following" : "creator-follow"} onClick={onToggleFollow}>{following ? "Дагасан" : "Дагах"}</button>
          <button type="button" className="creator-message" onClick={onMessage}>Зурвас бичих</button>
        </div>}

    <ProfileAbout creator={creator} joinedAt={joinedAt} />
  </aside>;
}
