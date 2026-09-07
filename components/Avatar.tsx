type AvatarProps = {
  /** Profile photo URL, when the person has set one in Тохиргоо. */
  url?: string | null;
  /** Fallback shown when there is no photo — the first letter of the display name. */
  initial: string;
  /** Extra classes from the caller; the sizes all live in the existing avatar CSS. */
  className?: string;
};

/**
 * One avatar for the whole app. Before this, every avatar was a letter, including for people
 * who had set a photo in settings — profiles.avatar_url was written and never read.
 *
 * The letter stays as the fallback rather than a placeholder image: it identifies the person,
 * and it is what the app looked like everywhere until a photo exists.
 */
export function Avatar({ url, initial, className = "" }: AvatarProps) {
  const classes = `account-avatar${className ? ` ${className}` : ""}`;
  const src = url?.trim();
  if (!src) return <span className={classes}>{initial}</span>;
  return <span className={`${classes} has-photo`}><img src={src} alt="" loading="lazy" /></span>;
}
