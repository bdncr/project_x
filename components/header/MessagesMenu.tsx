"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { Toast } from "../Toast";
import { OfferDetailModal } from "./OfferDetailModal";
import { JobOffer, OfferBox, OfferStatus, STATUS_LABEL, fetchAllOffers, markOffersRead, patchCachedOffers, respondToOffer } from "../../lib/job-offers";
import { relativeDate } from "../../lib/format";

type MessagesMenuProps = {
  userId: string | null;
  open: boolean;
  onToggle: () => void;
  onHoverOpen: () => void;
  onHoverClose: () => void;
  onClose: () => void;
};

const TABS: { key: OfferBox; label: string }[] = [
  { key: "inbox", label: "Ирсэн" },
  { key: "outbox", label: "Илгээсэн" },
];

/** The header's Зурвасууд menu: job offers received and sent. Opening the panel marks the
 * inbox read; opening one offer shows the whole thing, where the creator answers it. */
export function MessagesMenu({ userId, open, onToggle, onHoverOpen, onHoverClose, onClose }: MessagesMenuProps) {
  const [box, setBox] = useState<OfferBox>("inbox");
  const [inbox, setInbox] = useState<JobOffer[]>([]);
  const [outbox, setOutbox] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<JobOffer | null>(null);
  const [responding, setResponding] = useState(false);
  /* Its own toast: SiteHeader is presentational and none of the eight pages that render it
     would otherwise have a way to report an answer being sent. */
  const [toast, setToast] = useState("");
  const onNotify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3000); };

  /* Loaded once per sign-in, not per open: the panel is a hover target, so refetching on each
     pass over the icon would be a request per mouse movement. fetchAllOffers serves a
     module-level cache, which also stops the header remounting on every navigation from firing
     the pair of queries again. */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchAllOffers(userId).then(({ inbox: received, outbox: sent }) => {
      if (cancelled) return;
      setInbox(received);
      setOutbox(sent);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId]);

  const unread = inbox.filter((offer) => !offer.readAt).length;
  const pending = inbox.filter((offer) => offer.status === "pending").length;

  /* Opening the panel is the read receipt: stamp locally first so the dot clears at once. */
  useEffect(() => {
    if (!open || unread === 0) return;
    const stamp = new Date().toISOString();
    setInbox((all) => all.map((offer) => offer.readAt ? offer : { ...offer, readAt: stamp }));
    void markOffersRead(userId, inbox);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function respond(decision: Exclude<OfferStatus, "pending">, reply: string) {
    if (!selected || responding) return;
    setResponding(true);
    const { offer, error } = await respondToOffer(selected, decision, reply);
    setResponding(false);
    if (error || !offer) { onNotify(error ?? "Хариу илгээхэд алдаа гарлаа."); return; }
    const swap = (all: JobOffer[]) => all.map((existing) => existing.id === offer.id ? offer : existing);
    setInbox(swap);
    setOutbox(swap);
    patchCachedOffers(userId, (existing) => existing.id === offer.id ? offer : existing);
    setSelected(offer);
    onNotify(decision === "accepted" ? "Саналыг зөвшөөрлөө." : "Саналаас татгалзлаа.");
  }

  const list = box === "inbox" ? inbox : outbox;

  return <>
    <div className="header-hover-menu" onMouseEnter={onHoverOpen} onMouseLeave={onHoverClose}>
      <button className="header-icon" type="button" aria-label="Зурвасууд" aria-expanded={open} onClick={onToggle}>
        <Icon name="mail" />
        {unread > 0 && <span className="header-icon-dot" aria-label={`${unread} шинэ зурвас`} />}
      </button>

      {open && <div className="header-menu-panel">
        <div className="header-menu-head">
          <h3>Ажлын саналууд</h3>
          {pending > 0 && <span className="header-menu-count">{pending} хүлээгдэж буй</span>}
        </div>

        <div className="offer-tabs" role="tablist">
          {TABS.map((tab) => <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={box === tab.key}
            className={box === tab.key ? "offer-tab active" : "offer-tab"}
            onClick={() => setBox(tab.key)}
          >
            {tab.label}
            <b>{tab.key === "inbox" ? inbox.length : outbox.length}</b>
          </button>)}
        </div>

        {loading
          ? <div className="header-menu-loading" aria-hidden="true">
              <span className="skeleton skeleton-line" style={{ width: "70%" }} />
              <span className="skeleton skeleton-line" style={{ width: "45%" }} />
            </div>
          : list.length === 0
            ? <div className="header-menu-empty">
                <Icon name="mail" />
                <p>{box === "inbox" ? "Танд одоогоор ажлын санал ирээгүй байна." : "Та одоогоор санал илгээгээгүй байна."}</p>
              </div>
            : <ul className="offer-list">
                {list.map((offer) => <li key={offer.id} className={!offer.readAt && box === "inbox" ? "offer-row unread" : "offer-row"}>
                  <button type="button" onClick={() => setSelected(offer)}>
                    <div className="offer-row-head">
                      <strong>{box === "inbox" ? offer.senderName : offer.recipientName}</strong>
                      <time dateTime={offer.createdAt}>{relativeDate(offer.createdAt)}</time>
                    </div>
                    <p className="offer-title">{offer.title}</p>
                    <div className="offer-row-meta">
                      <span className={`offer-status offer-status-${offer.status}`}>{STATUS_LABEL[offer.status]}</span>
                      {offer.budget && <span className="offer-budget">{offer.budget}</span>}
                    </div>
                    {offer.note && <p className="offer-note">{offer.note}</p>}
                  </button>
                </li>)}
              </ul>}
      </div>}
    </div>

    {selected && <OfferDetailModal
      offer={selected}
      box={box}
      busy={responding}
      onClose={() => setSelected(null)}
      onRespond={(decision, reply) => void respond(decision, reply)}
    />}

    <Toast message={toast} className="jobs-toast" />
  </>;
}
