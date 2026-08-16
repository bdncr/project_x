import { EmploymentType, Job, WorkMode } from "./job-samples";

export type DatabaseJobRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  work_mode: WorkMode;
  employment_type: EmploymentType;
  salary_text: string;
  description: string;
  responsibilities: string[] | null;
  requirements: string[] | null;
  skills: string[] | null;
  applicants_count: number;
  company_color: string | null;
  hiring_contact: string | null;
  contact_role: string | null;
  published_at: string;
  closing_at: string | null;
};

export type JobForm = {
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  salary: string;
  description: string;
  skills: string;
  responsibilities: string;
  requirements: string;
};

export const emptyJobForm: JobForm = {
  title: "",
  company: "",
  location: "Улаанбаатар",
  workMode: "hybrid",
  employmentType: "full_time",
  salary: "",
  description: "",
  skills: "",
  responsibilities: "",
  requirements: "",
};

export const companyColors = ["#1769ff", "#682dde", "#e05252", "#008b80", "#23263d", "#a96f1a"];

export function randomCompanyColor() {
  return companyColors[Math.floor(Math.random() * companyColors.length)];
}

export function mapJob(row: DatabaseJobRow): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    workMode: row.work_mode,
    employmentType: row.employment_type,
    salary: row.salary_text,
    publishedAt: row.published_at,
    closingAt: row.closing_at,
    description: row.description,
    responsibilities: row.responsibilities || [],
    requirements: row.requirements || [],
    skills: row.skills || [],
    applicantsCount: row.applicants_count || 0,
    companyColor: row.company_color || "#1769ff",
    hiringContact: row.hiring_contact || "Project X hiring team",
    contactRole: row.contact_role || "Hiring manager",
  };
}

export function splitItems(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function normalizeJobForm(form: JobForm) {
  return {
    title: form.title.trim(),
    company: form.company.trim(),
    location: form.location.trim() || "Улаанбаатар",
    workMode: form.workMode,
    employmentType: form.employmentType,
    salary: form.salary.trim() || "Цалин тохиролцоно",
    description: form.description.trim(),
    skills: splitItems(form.skills),
    responsibilities: splitItems(form.responsibilities),
    requirements: splitItems(form.requirements),
  };
}

export function buildJobInsertPayload(form: JobForm, companyColor: string, hiringContact: string) {
  const fields = normalizeJobForm(form);
  return {
    title: fields.title,
    company: fields.company,
    location: fields.location,
    work_mode: fields.workMode,
    employment_type: fields.employmentType,
    salary_text: fields.salary,
    description: fields.description,
    skills: fields.skills,
    responsibilities: fields.responsibilities,
    requirements: fields.requirements,
    company_color: companyColor,
    hiring_contact: hiringContact,
    contact_role: "Job owner",
  };
}

export function buildLocalJob(form: JobForm, companyColor: string, hiringContact: string): Job {
  const fields = normalizeJobForm(form);
  return {
    id: "local-" + Date.now(),
    title: fields.title,
    company: fields.company,
    location: fields.location,
    workMode: fields.workMode,
    employmentType: fields.employmentType,
    salary: fields.salary,
    publishedAt: new Date().toISOString(),
    description: fields.description,
    responsibilities: fields.responsibilities,
    requirements: fields.requirements,
    skills: fields.skills,
    applicantsCount: 0,
    companyColor,
    hiringContact,
    contactRole: "Job owner",
    isLocal: true,
  };
}

const LOCAL_JOBS_KEY = "project-x-jobs-local";

export function loadLocalJobs(): Job[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(LOCAL_JOBS_KEY) || "[]");
    return Array.isArray(value) ? (value as Job[]) : [];
  } catch {
    return [];
  }
}

export function addLocalJob(job: Job) {
  window.localStorage.setItem(LOCAL_JOBS_KEY, JSON.stringify([job, ...loadLocalJobs()]));
}
