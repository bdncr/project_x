import { supabase } from "./supabase";

export type JobOffer = {
  id: string;
  jobId: string | null;
  projectId: string | null;
  senderId: string;
  senderName: string;
  recipientId: string;
  title: string;
  budget: string;
  note: string;
  createdAt: string;
  readAt: string | null;
};

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
  profiles: { display_name: string } | { display_name: string }[] | null;
};

function mapRow(row: OfferRow): JobOffer {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id, jobId: row.job_id, projectId: row.project_id,
    senderId: row.sender_id, senderName: profile?.display_name || "Ажил олгогч",
    recipientId: row.recipient_id, title: row.title, budget: row.budget, note: row.note,
    createdAt: row.created_at, readAt: row.read_at,
  };
}

/* ------------------------------ demo-mode persistence ------------------------------ */

function readLocal(): JobOffer[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(LOCAL_OFFERS_KEY) || "[]");
    return Array.isArray(value) ? (value as JobOffer[]) : [];
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
    return error?.message ?? null;
  }

  writeLocal([{
    id: `local-${Date.now()}`, jobId: input.jobId, projectId: input.projectId,
    senderId: input.sender.id ?? "local", senderName: input.sender.name,
    recipientId: input.recipientId, title: input.title, budget: input.budget, note: input.note,
    createdAt: new Date().toISOString(), readAt: null,
  }, ...readLocal()]);
  return null;
}

export async function fetchInbox(userId: string | null): Promise<{ offers: JobOffer[]; error: string | null }> {
  if (supabase && userId) {
    const { data, error } = await supabase
      .from("job_offers")
      .select("id,job_id,project_id,sender_id,recipient_id,title,budget,note,created_at,read_at,profiles!job_offers_sender_id_fkey(display_name)")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return { offers: [], error: error.message };
    return { offers: ((data ?? []) as unknown as OfferRow[]).map(mapRow), error: null };
  }

  /* Demo mode has a single visitor and no real recipient ids, so the local outbox doubles as
   * the inbox — otherwise the flow could never be seen end to end without a backend. */
  return { offers: readLocal(), error: null };
}

export async function markOffersRead(userId: string | null, offers: JobOffer[]): Promise<void> {
  const unread = offers.filter((offer) => !offer.readAt);
  if (unread.length === 0) return;
  const stamp = new Date().toISOString();

  if (supabase && userId) {
    await supabase.from("job_offers").update({ read_at: stamp }).eq("recipient_id", userId).is("read_at", null);
    return;
  }
  writeLocal(readLocal().map((offer) => offer.readAt ? offer : { ...offer, readAt: stamp }));
}
