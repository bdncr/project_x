import { supabase } from "./supabase";
import { JobForm, addLocalJob, buildJobInsertPayload, buildLocalJob, randomCompanyColor } from "./jobs-data";
import { sendOffer } from "./job-offers";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The budget bands offered in the invite dialog, coarsest first. */
export const BUDGET_OPTIONS = [
  "$100-с доош", "$500-1,000", "$5,000-10,000",
  "$100-250", "$1,000-2,500", "$10,000-25,000",
  "$250-500", "$2,500-5,000",
];

export const MAX_INVITE_CATEGORIES = 3;

export const DEFAULT_INVITE_NOTE = "Сайн байна уу, таны ажил миний хайж буй зүйлд маш сайн тохирч байна.";

export type HiringFor = "personal" | "company";

export type InviteForm = {
  title: string;
  categories: string[];
  budget: string;
  description: string;
  note: string;
  hiringFor: HiringFor;
  companyName: string;
  companyWebsite: string;
  companyLogoUrl: string;
};

export function emptyInviteForm(): InviteForm {
  return {
    title: "", categories: [], budget: "", description: "", note: DEFAULT_INVITE_NOTE,
    hiringFor: "personal", companyName: "", companyWebsite: "", companyLogoUrl: "",
  };
}

export type InviteErrors = { title?: string; company?: string };

export function validateInvite(form: InviteForm): InviteErrors {
  const errors: InviteErrors = {};
  if (!form.title.trim()) errors.title = "Ажлын нэр оруулна уу.";
  if (form.hiringFor === "company" && !form.companyName.trim()) errors.company = "Байгууллагын нэрээ оруулна уу.";
  return errors;
}

/**
 * Folds the invite into the same JobForm the jobs board posts, so an invitation lands on
 * /jobs as an ordinary listing rather than as a second, parallel kind of record.
 *
 * The personal note is carried into the description under its own heading: there is no
 * messaging table in this schema, so appending it is the only way it survives at all.
 */
export function buildInviteJobForm(form: InviteForm, inviterName: string, creatorName: string): JobForm {
  const noteLines = form.note.trim() ? `\n\nХувийн захиас (${creatorName}-д):\n${form.note.trim()}` : "";
  return {
    title: form.title.trim(),
    company: form.hiringFor === "company" ? form.companyName.trim() : inviterName,
    location: "Улаанбаатар",
    /* An invitation is a commission, not a staff opening. */
    workMode: "remote",
    employmentType: "freelance",
    salary: form.budget || "Төсөв тохиролцоно",
    description: `${form.description.trim()}${noteLines}`.trim(),
    skills: form.categories.join(", "),
    responsibilities: "",
    requirements: "",
  };
}

export type SendInviteResult = { error: string | null };

/**
 * Posts the listing, then delivers the offer to the creator's inbox. The listing is the
 * record; the offer is how the creator is actually told, so a failure to insert the offer is
 * reported even though the job itself was created.
 */
export async function sendInvite(options: {
  form: InviteForm;
  creatorName: string;
  recipientId: string;
  projectId: string;
  author: { id: string | null; name: string };
}): Promise<SendInviteResult> {
  const { form, creatorName, recipientId, projectId, author } = options;
  const jobForm = buildInviteJobForm(form, author.name, creatorName);
  const color = randomCompanyColor();
  const deliver = (jobId: string | null) => sendOffer({
    jobId, projectId: UUID_RE.test(projectId) ? projectId : null,
    recipientId, title: jobForm.title, budget: jobForm.salary, note: form.note.trim(),
    sender: author,
  });

  if (supabase && author.id) {
    const payload = buildJobInsertPayload(jobForm, color, author.name);
    const { data, error } = await supabase.from("job_posts").insert({ ...payload, owner_id: author.id }).select("id").single();
    if (error || !data) return { error: error?.message ?? "Ажлын зар үүсгэхэд алдаа гарлаа." };
    return { error: await deliver(data.id as string) };
  }

  const local = buildLocalJob(jobForm, color, author.name);
  addLocalJob(local);
  return { error: await deliver(null) };
}
