"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "../Icon";
import { JobOffer, MAX_REPLY_LENGTH, OfferStatus, STATUS_LABEL } from "../../lib/job-offers";
import { formatDate } from "../../lib/format";

type OfferDetailModalProps = {
  offer: JobOffer;
  /** "inbox" — the creator, who may answer. "outbox" — the employer, who can only watch. */
  box: "inbox" | "outbox";
  busy: boolean;
  onClose: () => void;
  onRespond: (decision: Exclude<OfferStatus, "pending">, reply: string) => void;
};

/** The whole offer: who sent it, the budget, the personal note, and — for the creator — the
 * accept/decline it has been missing. Once answered the panel shows the answer instead of the
 * form, because an offer is answered once. */
export function OfferDetailModal({ offer, box, busy, onClose, onRespond }: OfferDetailModalProps) {
  const [reply, setReply] = useState("");
  const answered = offer.status !== "pending";
  const counterpart = box === "inbox" ? offer.senderName : offer.recipientName;

  return <div className="jobs-modal-backdrop" onClick={onClose}>
    <section className="jobs-modal offer-modal" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="jobs-modal-close" onClick={onClose} aria-label="Хаах"><Icon name="close" /></button>

      <header className="offer-modal-head">
        <span className="account-avatar offer-modal-avatar">{counterpart.slice(0, 1).toUpperCase()}</span>
        <div>
          <p className="offer-modal-kicker">{box === "inbox" ? "Танд ирсэн санал" : "Таны илгээсэн санал"}</p>
          <h2>{offer.title}</h2>
          <p className="offer-modal-from">{counterpart} · {formatDate(offer.createdAt)}</p>
        </div>
        <span className={`offer-status offer-status-${offer.status}`}>{STATUS_LABEL[offer.status]}</span>
      </header>

      <div className="offer-modal-body">
        {offer.budget && <div className="offer-fact">
          <p className="offer-fact-label">ТӨСӨВ</p>
          <p className="offer-fact-value">{offer.budget}</p>
        </div>}

        {offer.note && <div className="offer-fact">
          <p className="offer-fact-label">ХУВИЙН ЗАХИАС</p>
          <p className="offer-note-full">{offer.note}</p>
        </div>}

        <div className="offer-links">
          {offer.jobId && <Link href="/jobs" className="offer-link" onClick={onClose}><Icon name="briefcase" />Ажлын зар харах</Link>}
          {offer.projectId && <Link href={`/project/${offer.projectId}`} className="offer-link" onClick={onClose}><Icon name="image" />Холбоотой төсөл</Link>}
        </div>

        {answered ? <div className="offer-answer">
          <p className="offer-fact-label">
            {offer.status === "accepted" ? "ЗӨВШӨӨРСӨН" : "ТАТГАЛЗСАН"}
            {offer.respondedAt && ` · ${formatDate(offer.respondedAt)}`}
          </p>
          {offer.reply
            ? <p className="offer-note-full">{offer.reply}</p>
            : <p className="offer-empty-reply">Хариу бичээгүй.</p>}
        </div> : box === "inbox" ? <div className="offer-respond">
          <label className="offer-fact-label" htmlFor="offer-reply">ХАРИУ (сонголтоор)</label>
          <textarea
            id="offer-reply"
            rows={3}
            maxLength={MAX_REPLY_LENGTH}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Хугацаа, нөхцөл, тодруулах асуулт…"
          />
          <div className="offer-actions">
            <button type="button" className="offer-accept" disabled={busy} onClick={() => onRespond("accepted", reply)}>
              <Icon name="check" />{busy ? "Илгээж байна…" : "Зөвшөөрөх"}
            </button>
            <button type="button" className="offer-decline" disabled={busy} onClick={() => onRespond("declined", reply)}>
              <Icon name="close" />Татгалзах
            </button>
          </div>
        </div> : <p className="offer-waiting"><Icon name="clock" />Бүтээгчийн хариуг хүлээж байна.</p>}
      </div>
    </section>
  </div>;
}
