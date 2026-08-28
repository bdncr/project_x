"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "../Icon";
import { Creator, TAG_CLASS } from "../../lib/creator-samples";
import { fetchCreatorSummary } from "../../lib/creator-lookup";
import { compactNumber } from "../../lib/format";
import { useHoverCard } from "../../lib/use-hover-card";

type CreatorHoverCardProps = {
  ownerId: string;
  name: string;
  role: string;
  initial: string;
  following: boolean;
  onToggleFollow: () => void;
  onInvite: () => void;
};

/** The rail's follow control plus the creator card that opens off it: a strip of their recent
 * covers, the avatar sitting over it, then location, status pills, stats and the two actions.
 * The stats are fetched on first hover only — a project nobody hovers never pays for the
 * lookup. */
export function CreatorHoverCard({ ownerId, name, role, initial, following, onToggleFollow, onInvite }: CreatorHoverCardProps) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(false);
  const requestedRef = useRef(false);

  const { open, hoverProps, reset } = useHoverCard(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    setLoading(true);
    void fetchCreatorSummary(ownerId, name)
      .then(setCreator)
      .catch(() => setCreator(null))
      .finally(() => setLoading(false));
  });

  /* A different project means a different creator; drop the cache so the next hover refetches. */
  useEffect(() => {
    requestedRef.current = false;
    setCreator(null);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, name]);

  const profileHref = creator ? `/profile/${encodeURIComponent(creator.id)}` : null;
  const thumbs = creator?.thumbnails.slice(0, 3) ?? [];

  return <div className="case-rail-pop case-rail-creator" {...hoverProps}>
    <button type="button" className="case-rail-item case-rail-follow" aria-expanded={open} onClick={onToggleFollow}>
      <span className={following ? "account-avatar case-rail-avatar following" : "account-avatar case-rail-avatar"}>{initial}</span>
      <small>{following ? "Дагасан" : "Дагах"}</small>
    </button>

    {open && <div className="rail-card creator-card-pop" role="dialog" aria-label={`${name} бүтээгч`}>
      {/* The strip is decorative: it repeats covers reachable from the profile link below. */}
      <div className="creator-pop-strip" aria-hidden="true">
        {thumbs.length > 0
          ? thumbs.map((src, index) => <img key={index} src={src} alt="" />)
          : <span className="creator-pop-strip-empty" />}
      </div>

      <span className="account-avatar creator-pop-avatar">{initial}</span>

      <div className="creator-pop-body">
        {profileHref
          ? <Link href={profileHref} className="creator-pop-name">{name}</Link>
          : <span className="creator-pop-name">{name}</span>}

        {creator
          ? <p className="creator-pop-location"><Icon name="pin" />{creator.location}</p>
          : <p className="creator-pop-location creator-pop-role">{role}</p>}

        {creator && creator.tags.length > 0 && <div className="creator-pop-tags">
          {creator.tags.map((tag) => <span key={tag} className={TAG_CLASS[tag] ?? ""}>{tag}</span>)}
        </div>}

        {loading && !creator
          ? <div className="creator-pop-skeleton" aria-hidden="true">
              <span className="skeleton skeleton-line" />
              <span className="skeleton skeleton-line" />
            </div>
          : creator && <div className="creator-pop-stats">
              <div><b>{compactNumber(creator.appreciations)}</b><span>Талархал</span></div>
              <div><b>{compactNumber(creator.followers)}</b><span>Дагагч</span></div>
              <div><b>{compactNumber(creator.projectViews)}</b><span>Үзэлт</span></div>
            </div>}

        <button type="button" className={following ? "creator-pop-follow following" : "creator-pop-follow"} onClick={onToggleFollow}>
          <Icon name={following ? "check" : "plus"} />{following ? "Дагасан" : "Дагах"}
        </button>
        <button type="button" className="creator-pop-hire" onClick={onInvite}><Icon name="mail" />Ажлын санал илгээх</button>
      </div>
    </div>}
  </div>;
}
