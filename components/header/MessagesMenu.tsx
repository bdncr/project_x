"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "../Icon";
import { JobOffer, fetchInbox, markOffersRead } from "../../lib/job-offers";
import { relativeDate } from "../../lib/format";

type MessagesMenuProps = {
  userId: string | null;
  open: boolean;
  onToggle: () => void;
  onHoverOpen: () => void;
  onHoverClose: () => void;
  onClose: () => void;
};

/** The header's Зурвасууд menu. Job offers sent from a project page land here — see
 * lib/job-offers.ts — and the icon carries an unread dot until the panel is opened. */
export function MessagesMenu({ userId, open, onToggle, onHoverOpen, onHoverClose, onClose }: MessagesMenuProps) {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);

  /* Loaded once per sign-in rather than on every open: the panel is a hover target, and
     refetching on each pass over the icon would be a request per mouse movement. */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchInbox(userId).then(({ offers: loaded }) => {
      if (cancelled) return;
      setOffers(loaded);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId]);

  const unread = offers.filter((offer) => !offer.readAt).length;

  /* Opening the panel is the read receipt: stamp locally first so the dot clears at once. */
  useEffect(() => {
    if (!open || unread === 0) return;
    const stamp = new Date().toISOString();
    setOffers((all) => all.map((offer) => offer.readAt ? offer : { ...offer, readAt: stamp }));
    void markOffersRead(userId, offers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return <div className="header-hover-menu" onMouseEnter={onHoverOpen} onMouseLeave={onHoverClose}>
    <button className="header-icon" type="button" aria-label="Зурвасууд" aria-expanded={open} onClick={onToggle}>
      <Icon name="mail" />
      {unread > 0 && <span className="header-icon-dot" aria-label={`${unread} шинэ зурвас`} />}
    </button>

    {open && <div className="header-menu-panel">
      <div className="header-menu-head"><h3>Зурвасууд</h3></div>

      {loading
        ? <div className="header-menu-loading" aria-hidden="true">
            <span className="skeleton skeleton-line" style={{ width: "70%" }} />
            <span className="skeleton skeleton-line" style={{ width: "45%" }} />
          </div>
        : offers.length === 0
          ? <div className="header-menu-empty"><Icon name="mail" /><p>Танд одоогоор зурвас алга байна.</p></div>
          : <ul className="offer-list">
              {offers.map((offer) => {
                const body = <>
                  <div className="offer-row-head">
                    <strong>{offer.senderName}</strong>
                    <time dateTime={offer.createdAt}>{relativeDate(offer.createdAt)}</time>
                  </div>
                  <p className="offer-title">{offer.title}</p>
                  {offer.budget && <span className="offer-budget">{offer.budget}</span>}
                  {offer.note && <p className="offer-note">{offer.note}</p>}
                </>;
                return <li key={offer.id} className={offer.readAt ? "offer-row" : "offer-row unread"}>
                  {/* Backend offers link to the listing they created; a demo offer has no
                      job row to open, so it stays plain text. */}
                  {offer.jobId
                    ? <Link href="/jobs" onClick={onClose}>{body}</Link>
                    : <div>{body}</div>}
                </li>;
              })}
            </ul>}
    </div>}
  </div>;
}
