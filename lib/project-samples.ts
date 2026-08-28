import type { ProjectBlock, ProjectVisibility } from "./project-editor";

export type ContentStatus = "published" | "draft";

export type ContentItem = {
  id: string;
  ownerId: string;
  title: string;
  creator: string;
  role: string;
  category: string;
  summary: string;
  coverUrl: string;
  likes: number;
  views: number;
  saved: boolean;
  liked: boolean;
  status: ContentStatus;
  createdAt: string;
  /** Rich block content from the project editor. Absent for the seed/demo dataset,
   * which instead gets a synthesized case-study body (see projectGallery/projectOverview). */
  blocks?: ProjectBlock[];
  /** An optional call-to-action button set from the editor's "Захиалгат товч" panel. */
  customButtonLabel?: string;
  customButtonUrl?: string;
  /** Settings-modal fields (see components/project/editor/SettingsModal.tsx). All optional
   * so the seed/demo dataset above doesn't need updating. */
  tags?: string[];
  visibility?: ProjectVisibility;
  isMature?: boolean;
  commentsDisabled?: boolean;
  license?: string;
};

function sample(
  id: string,
  title: string,
  creator: string,
  role: string,
  category: string,
  summary: string,
  coverUrl: string,
  likes: number,
  views: number,
  createdAt: string,
): ContentItem {
  return { id, ownerId: "seed", title, creator, role, category, summary, coverUrl, likes, views, saved: false, liked: false, status: "published", createdAt };
}

const img = (photoId: string, crop = "3:4") => `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=800&h=${crop === "3:4" ? 1000 : crop === "1:1" ? 800 : 600}&q=80`;

const CATEGORY_TOOLS: Record<string, string[]> = {
  "Брэнд": ["Adobe Illustrator", "Photoshop", "Брэндийн гарын авлага", "Typography"],
  "График": ["InDesign", "Illustrator", "Хэвлэлийн бэлтгэл", "Typography"],
  "Гэрэл зураг": ["Lightroom", "Capture One", "Студийн гэрэлтүүлэг", "Retouching"],
  "Зураглал": ["Procreate", "Photoshop", "Дүрийн дизайн", "Concept Art"],
  "UX/UI": ["Figma", "Prototyping", "Хэрэглэгчийн судалгаа", "Design systems"],
  "3D": ["Blender", "Cinema 4D", "V-Ray", "Substance Painter"],
  "Motion": ["After Effects", "Cinema 4D", "Premiere Pro", "Sound design"],
};

export function toolsForCategory(category: string): string[] {
  return CATEGORY_TOOLS[category] ?? ["Adobe Creative Suite", "Figma", "Урсгал зохион байгуулалт"];
}

/** Derives a sequence of differently-cropped case-study frames from one cover photo. */
export function projectGallery(coverUrl: string): string[] {
  const base = coverUrl.split("?")[0];
  if (!base) return [];
  const variant = (w: number, h: number, crop: string) => `${base}?auto=format&fit=crop&w=${w}&h=${h}&q=85&crop=${crop}`;
  return [
    variant(1760, 990, "entropy"),
    variant(1200, 1500, "faces"),
    variant(1760, 1100, "edges"),
    variant(1200, 900, "entropy"),
    variant(1760, 1180, "top"),
  ];
}

export function projectOverview(item: Pick<ContentItem, "summary" | "category" | "role">): string[] {
  return [
    item.summary,
    `${item.role}-ийн үүднээс би санаа тодорхойлохоос эхлээд эцсийн хүргэлт хүртэлх бүх шатыг хариуцлаа: судалгаа, олон хувилбарын эскиз, санал асуулга, эцсийн шийдвэрийг нарийвчлан гүйцэтгэсэн.`,
    `Эцсийн үр дүн нь ${item.category.toLowerCase()} чиглэлээр захиалагчийн зорилтод бүрэн нийцсэн, цаашид өргөтгөх боломжтой тогтвортой визуал шийдэл болсон.`,
  ];
}

export const SAMPLE_PROJECTS: ContentItem[] = [
  sample("proj-01", "Nomad Coffee — брэндийн айдентик", "Наранцэцэг Б.", "Brand Designer", "Брэнд", "Улаанбаатарын шинэ кофе шопын лого, савлагаа, дэлгүүрийн бүрэн визуал системийг боловсрууллаа.", img("1561070791-2526d30994b5", "1:1"), 142, 2300, "2026-08-10T08:00:00.000Z"),
  sample("proj-02", "Steppe Hotels лого шинэчлэл", "Мөнхжин Д.", "Brand Strategist", "Брэнд", "Зочид буудлын сүлжээний брэнд стратеги, лого, өнгө, typography системийг дахин боловсрууллаа.", img("1561070791-2526d30994b5", "3:4"), 98, 1600, "2026-08-08T08:00:00.000Z"),
  sample("proj-03", "Хаан Атц — картын дизайн", "Билгүүн Л.", "Graphic Designer", "Брэнд", "Дижитал болон физик картны шинэ визуал хэв маягийг санал болголоо.", img("1561070791-2526d30994b5", "16:9"), 76, 1100, "2026-08-05T08:00:00.000Z"),
  sample("proj-04", "Naadam фестивалийн постер цуврал", "Марал А.", "Graphic Designer", "График", "Зуны Наадам баярт зориулсан 6 ширхэг постерын цуврал, гар зургийн хэв маягаар.", img("1618005198919-d3d4b5a92ead", "3:4"), 231, 4100, "2026-08-12T08:00:00.000Z"),
  sample("proj-05", "UB Magazine — хуудасны дизайн", "Энхмаа С.", "Editorial Designer", "График", "Сэтгүүлийн дугаар бүрийн layout, typography, зурагжуулалтын системийг хариуцсан.", img("1618005198919-d3d4b5a92ead", "1:1"), 87, 1450, "2026-08-06T08:00:00.000Z"),
  sample("proj-06", "Gobi Digital брошур", "Гантулга Х.", "Graphic Designer", "График", "Технологийн компанийн үйлчилгээний танилцуулга материалын дизайн.", img("1618005198919-d3d4b5a92ead", "16:9"), 54, 890, "2026-08-02T08:00:00.000Z"),
  sample("proj-07", "Говийн нүүдэлчид", "Тэмүүлэн Д.", "Photographer", "Гэрэл зураг", "Өмнөговь аймгийн нүүдэлчдийн өдөр тутмын амьдралыг харуулсан баримтат зургийн цуврал.", img("1492691527719-9d1e07e534b4", "3:4"), 312, 5200, "2026-08-14T08:00:00.000Z"),
  sample("proj-08", "Хотын архитектур цуврал", "Оюунгэрэл Н.", "Photographer", "Гэрэл зураг", "Улаанбаатар хотын орчин үеийн барилгуудыг дүрсэлсэн минимал хэв маягийн зургийн цуврал.", img("1492691527719-9d1e07e534b4", "1:1"), 176, 2900, "2026-08-09T08:00:00.000Z"),
  sample("proj-09", "Hunnu Coffee — бүтээгдэхүүний зураг", "Хулан Ж.", "Product Photographer", "Гэрэл зураг", "Орон нутгийн кофе брэндийн бүтээгдэхүүний каталогт зориулсан студийн зураг авалт.", img("1492691527719-9d1e07e534b4", "16:9"), 63, 1050, "2026-08-01T08:00:00.000Z"),
  sample("proj-10", "Монгол домгийн дүрүүд", "Ундрах О.", "Illustrator", "Зураглал", "Монгол ардын үлгэрийн дүрүүдийг орчин үеийн хэв маягаар дахин дүрсэлсэн цуврал.", img("1547891654-e66ed7ebb968", "3:4"), 289, 3800, "2026-08-13T08:00:00.000Z"),
  sample("proj-11", "'Алтан гадас' хүүхдийн ном", "Билгүүн Л.", "Character Illustrator", "Зураглал", "Хүүхдийн номын дүрс, хуудас бүрийн зохион байгуулалтыг бүрэн хариуцсан.", img("1547891654-e66ed7ebb968", "1:1"), 154, 2200, "2026-08-07T08:00:00.000Z"),
  sample("proj-12", "Character Pack — Adventure", "Саруул Г.", "Game Illustrator", "Зураглал", "Мобайл тоглоомд зориулсан дүрийн загварчлал, өнгөний хувилбарууд.", img("1547891654-e66ed7ebb968", "16:9"), 91, 1600, "2026-08-03T08:00:00.000Z"),
  sample("proj-13", "Fintech апп дахин загварчлал", "Баттөр Д.", "Product Designer", "UX/UI", "Санхүүгийн аппын хэрэглэгчийн туршлага, интерфэйсийг судалгаанд үндэслэн бүрэн шинэчиллээ.", img("1551650975-87deedd944c3", "3:4"), 267, 4400, "2026-08-15T08:00:00.000Z"),
  sample("proj-14", "Landio — AI компанийн лэндинг", "Мөнх-Оргил Б.", "UX/UI Designer", "UX/UI", "AI SaaS компанийн хөрвөлтийг нэмэгдүүлэхэд чиглэсэн лэндинг хуудасны дизайн.", img("1551650975-87deedd944c3", "1:1"), 203, 3300, "2026-08-11T08:00:00.000Z"),
  sample("proj-15", "Delivery апп UX судалгаа", "Уянга П.", "UX Researcher", "UX/UI", "Хүнс хүргэлтийн аппын захиалгын урсгалыг хэрэглэгчийн судалгаагаар хялбаршууллаа.", img("1551650975-87deedd944c3", "16:9"), 118, 1900, "2026-08-04T08:00:00.000Z"),
  sample("proj-16", "Nomad House — 3D интерьер", "Ариунболд Э.", "3D Artist", "3D", "Орчин үеийн амины сууцны интерьерийн 3D визуалчлал, материалын судалгаа.", img("1634017839464-5c339ebe3cb4", "3:4"), 174, 2700, "2026-08-13T14:00:00.000Z"),
  sample("proj-17", "Бүтээгдэхүүний 3D загвар", "Эрдэнэбат Д.", "3D Artist", "3D", "Хэрэглээний барааны 3D загварчлал, продукт рендерийн цуврал.", img("1634017839464-5c339ebe3cb4", "1:1"), 82, 1300, "2026-08-06T14:00:00.000Z"),
  sample("proj-18", "Virtual Showroom", "Гэрэлмаа Ж.", "3D Visualizer", "3D", "Машины загварыг онлайнаар эргүүлж үзэх боломжтой интерактив 3D орчин.", img("1634017839464-5c339ebe3cb4", "16:9"), 145, 2400, "2026-08-09T14:00:00.000Z"),
  sample("proj-19", "Brand Motion Reel 2026", "Туяа Э.", "Motion Designer", "Motion", "Оны турш хийсэн шилдэг ажлуудыг нэгтгэсэн богино хэлбэрийн motion reel.", img("1531058020387-3be344556be6", "3:4"), 221, 3600, "2026-08-14T14:00:00.000Z"),
  sample("proj-20", "App Onboarding анимаци", "Мишээл Р.", "Motion Designer", "Motion", "Аппын эхлэлийн дэлгэцүүдэд зориулсан богино микро-анимацийн цуврал.", img("1531058020387-3be344556be6", "1:1"), 96, 1550, "2026-08-05T14:00:00.000Z"),
];

const LOCAL_PROJECTS_KEY = "project-x-local-projects";

/** Demo-mode persistence for projects created without a configured backend, mirroring
 * the jobs board's local-draft pattern in lib/jobs-data.ts. */
export function loadLocalProjects(): ContentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(LOCAL_PROJECTS_KEY) || "[]");
    return Array.isArray(value) ? (value as ContentItem[]) : [];
  } catch {
    return [];
  }
}

export function addLocalProject(item: ContentItem) {
  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify([item, ...loadLocalProjects()]));
}

/** Rewrites one locally-created project in place, keeping its position in the list so the
 * gallery order does not jump when the author edits an existing piece. Returns false when
 * the id belongs to the read-only seed gallery rather than a local draft. */
export function updateLocalProject(id: string, patch: Partial<ContentItem>): boolean {
  const all = loadLocalProjects();
  const index = all.findIndex((project) => project.id === id);
  if (index === -1) return false;
  all[index] = { ...all[index], ...patch, id };
  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(all));
  return true;
}

/** Drops one locally-created project. Returns false for an id that is not a local draft —
 * the seed gallery is read-only. */
export function removeLocalProject(id: string): boolean {
  const all = loadLocalProjects();
  const next = all.filter((project) => project.id !== id);
  if (next.length === all.length) return false;
  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(next));
  return true;
}

/** All projects available in demo mode: locally-created projects first, then the seed gallery. */
export function loadDemoProjects(): ContentItem[] {
  return [...loadLocalProjects(), ...SAMPLE_PROJECTS];
}
