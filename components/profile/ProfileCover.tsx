import { Icon } from "../Icon";

type ProfileCoverProps = {
  coverUrl?: string;
  isSelf: boolean;
  onAddCover: () => void;
};

export function ProfileCover({ coverUrl, isSelf, onAddCover }: ProfileCoverProps) {
  return <div className="profile-cover">
    {coverUrl && <img src={coverUrl} alt="" />}
    {!coverUrl && isSelf && <button type="button" className="profile-cover-add" onClick={onAddCover}>
      <Icon name="image" />
      <span>Ковер зураг нэмэх</span>
      <small>Санал болгох хэмжээ 3200 × 410px</small>
    </button>}
  </div>;
}
