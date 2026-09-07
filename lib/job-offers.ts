import { supabase } from "./supabase";

/** An offer is answered once, in place — there is no back-and-forth thread. */
export type OfferStatus = "pending" | "accepted" | "declined";

export type JobOffer = {
  id: string;
  jobId: string | null;
  projectId: string | null;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  title: string;
  budget: string;
  note: string;
  createdAt: string;
  readAt: string | null;
  status: OfferStatus;
  /** The creator's message back, written alongside accept or decline. */
  reply: string;
  respondedAt: string | null;
};

export const STATUS_LABEL: Record<OfferStatus, string> = {
  pending: "Хүлээгдэж буй",
  accepted: "Зөвшөөрсөн",
  declined: "Татгалзсан",
};

export const MAX_REPLY_LENGTH = 600;

const LOCAL_OFFERS_KEY = "project-x-job-offers";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** An offer can only be stored against a real profile row. Seed creators are stamped "seed"
 * and demo drafts "local", so those go to localStorage instead. */
export function canDeliverRemotely(recipientId: string): boolean {
  return !!supabase && UUID_RE.test(recipientId);
}

type OfferRow = {
  id: string; job_id: string | null; project_id: string | null;
  sender_id: string; recipient_id: string; title: string; budget: string; note: string;
  created_at: string; read_at: string | null;
  status: OfferStatus | null; reply: string | null; responded_at: string | null;
  sender?: { display_name: string } | { display_name: string }[] | null;
  recipient?: { display_name: string } | { display_name: string }[] | null;
};

const one = (value: { display_name: string } | { display_name: string }[] | null | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.display_name || "";

function mapRow(row: OfferRow): JobOffer {
  return {
    id: row.id, jobId: row.job_id, projectId: row.project_id,
    senderId: row.sender_id, senderName: one(row.sender) || "Ажил олгогч",
    recipientId: row.recipient_id, recipientName: one(row.recipient) || "Бүтээгч",
    title: row.title, budget: row.budget, note: row.note,
    createdAt: row.created_at, readAt: row.read_at,
    status: row.status ?? "pending", reply: row.reply ?? "", respondedAt: row.responded_at,
  };
}

/* Aliased embeds so one row shape can carry both sides of the offer; without the alias the
   two profile joins would collide on the same key. */
const COLUMNS =
  "id,job_id,project_id,sender_id,recipient_id,title,budget,note,created_at,read_at,status,reply,responded_at," +
  "sender:profiles!job_offers_sender_id_fkey(display_name)," +
  "recipient:profiles!job_offers_recipient_id_fkey(display_name)";

/* ------------------------------ demo-mode persistence ------------------------------ */

function readLocal(): JobOffer[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(LOCAL_OFFERS_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    /* Offers stored before the answer columns existed default to pending. */
    return (value as JobOffer[]).map((offer) => ({
      ...offer,
      recipientName: offer.recipientName ?? "Бүтээгч",
      status: offer.status ?? "pending",
      reply: offer.reply ?? "",
      respondedAt: offer.respondedAt ?? null,
    }));
  } catch {
    return [];
  }
}

function writeLocal(all: JobOffer[]) {
  window.localStorage.setItem(LOCAL_OFFERS_KEY, JSON.stringify(all));
}

/* ------------------------------------- the API ------------------------------------- */

export type SendOfferInput = {
  jobId: string | null;
  projectId: string | null;
  recipientId: string;
  recipientName: string;
  title: string;
  budget: string;
  note: string;
  sender: { id: string | null; name: string };
};

export async function sendOffer(input: SendOfferInput): Promise<string | null> {
  if (canDeliverRemotely(input.recipientId) && input.sender.id) {
    /* Offering on your own project is blocked by a table constraint as well as by the UI. */
    if (input.sender.id === input.recipientId) return "Өөрийн бүтээлд санал илгээх боломжгүй.";
    const { error } = await supabase!.from("job_offers").insert({
      job_id: input.jobId, project_id: input.projectId,
      sender_id: input.sender.id, recipient_id: input.recipientId,
      title: input.title, budget: input.budget, note: input.note,
    });
    if (!error) clearOfferCache();
    return error?.message ?? null;
  }

  writeLocal([{
    id: `local-${Date.now()}`, jobId: input.jobId, projectId: input.projectId,
    senderId: input.sender.id ?? "local", senderName: input.sender.name,
    recipientId: input.recipientId, recipientName: input.recipientName,
    title: input.title, budget: input.budget, note: input.note,
    createdAt: new Date().toISOString(), readAt: null,
    status: "pending", reply: "", respondedAt: null,
  }, ...readLocal()]);
  clearOfferCache();
  return null;
}

export type OfferBox = "inbox" | "outbox";

export async function fetchOffers(box: OfferBox, userId: string | null): Promise<{ offers: JobOffer[]; error: string | null }> {
  if (supabase && userId) {
    const column = box === "inbox" ? "recipient_id" : "sender_id";
    const { data, error } = await supabase
      .from("job_offers")
      .select(COLUMNS)
      .eq(column, userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) return { offers: [], error: error.message };
    return { offers: ((data ?? []) as unknown as OfferRow[]).map(mapRow), error: null };
  }

  /* Demo mode has a single visitor and no real profile ids, so the same local list serves as
   * both boxes — otherwise neither side of the flow could be seen without a backend. */
  return { offers: readLocal(), error: null };
}

/**
 * The last inbox/outbox fetch, held outside React and stamped with the viewer it belongs to.
 *
 * SiteHeader is rendered by each of the thirteen pages rather than by the layout, so it
 * remounts on every navigation — without this the menu fired two queries per page change.
 * Mutations (answering, marking read) write through, so the cache never goes stale behind the
 * UI, and a real reload drops the module, which is when a refetch is wanted.
 */
type OfferCache = { viewer: string | null; inbox: JobOffer[]; outbox: JobOffer[] };
let cache: OfferCache | null = null;

/** Dropped whenever an offer is sent, so the next open refetches rather than showing a list
 * that predates it. */
export function clearOfferCache() { cache = null; }

export function getCachedOffers(userId: string | null) {
  return cache && cache.viewer === userId ? { inbox: cache.inbox, outbox: cache.outbox } : null;
}

function writeCache(userId: string | null, inbox: JobOffer[], outbox: JobOffer[]) {
  cache = { viewer: userId, inbox, outbox };
}

/** Keeps the cache in step with a change the UI has already applied locally. */
export function patchCachedOffers(userId: string | null, update: (offer: JobOffer) => JobOffer) {
  if (!cache || cache.viewer !== userId) return;
  cache = { viewer: userId, inbox: cache.inbox.map(update), outbox: cache.outbox.map(update) };
}

/** Both boxes in one call, so the caller caches them together or not at all. */
export async function fetchAllOffers(userId: string | null): Promise<{ inbox: JobOffer[]; outbox: JobOffer[] }> {
  const cached = getCachedOffers(userId);
  if (cached) return cached;
  const [received, sent] = await Promise.all([fetchOffers("inbox", userId), fetchOffers("outbox", userId)]);
  writeCache(userId, received.offers, sent.offers);
  return { inbox: received.offers, outbox: sent.offers };
}

export async function markOffersRead(userId: string | null, offers: JobOffer[]): Promise<void> {
  if (!offers.some((offer) => !offer.readAt)) return;
  const stamp = new Date().toISOString();

  patchCachedOffers(userId, (offer) => offer.readAt ? offer : { ...offer, readAt: stamp });

  if (supabase && userId) {
    await supabase.from("job_offers").update({ read_at: stamp }).eq("recipient_id", userId).is("read_at", null);
    return;
  }
  writeLocal(readLocal().map((offer) => offer.readAt ? offer : { ...offer, readAt: stamp }));
}

export type RespondResult = { offer: JobOffer | null; error: string | null };

/** The creator accepts or declines. Only the recipient may call this, and only once — an
 * already-answered offer is rejected here as well as by the UI. */
export async function respondToOffer(offer: JobOffer, decision: Exclude<OfferStatus, "pending">, reply: string): Promise<RespondResult> {
  if (offer.status !== "pending") return { offer: null, error: "Энэ саналд аль хэдийн хариу өгсөн байна." };
  const trimmed = reply.trim().slice(0, MAX_REPLY_LENGTH);
  const respondedAt = new Date().toISOString();

  if (supabase && !offer.id.startsWith("local-")) {
    const { data, error } = await supabase
      .from("job_offers")
      .update({ status: decision, reply: trimmed, responded_at: respondedAt, read_at: offer.readAt ?? respondedAt })
      .eq("id", offer.id)
      .select(COLUMNS)
      .single();
    if (error || !data) return { offer: null, error: error?.message ?? "Хариу илгээхэд алдаа гарлаа." };
    return { offer: mapRow(data as unknown as OfferRow), error: null };
  }

  const answered: JobOffer = { ...offer, status: decision, reply: trimmed, respondedAt, readAt: offer.readAt ?? respondedAt };
  writeLocal(readLocal().map((existing) => existing.id === offer.id ? answered : existing));
  return { offer: answered, error: null };
}
