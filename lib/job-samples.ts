export type EmploymentType = "freelance" | "full_time" | "contract";
export type WorkMode = "remote" | "hybrid" | "on_site";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  salary: string;
  publishedAt: string;
  closingAt?: string | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  applicantsCount: number;
  companyColor: string;
  hiringContact: string;
  contactRole: string;
  isLocal?: boolean;
};

const roleExpectations = [
  "Энэ чиглэлээр 2+ жил ажилласан туршлагатай байх",
  "Багийн орчинд санаачилгатай, ойлгомжтой харилцдаг байх",
  "Ажлын жишээ болон portfolio-оо илгээх",
];

function sample(
  id: string,
  title: string,
  company: string,
  location: string,
  workMode: WorkMode,
  employmentType: EmploymentType,
  salary: string,
  publishedAt: string,
  description: string,
  skills: string[],
  applicantsCount: number,
  companyColor: string,
  hiringContact: string,
): Job {
  return {
    id,
    title,
    company,
    location,
    workMode,
    employmentType,
    salary,
    publishedAt,
    description,
    responsibilities: [
      "Төслийн зорилго, багийн ажлын урсгалыг ойлгож хэрэгжүүлэх",
      "Өндөр чанартай, хугацаандаа хүлээлгэн өгөх ажлын шийдэл гаргах",
      "Баг болон захиалагчийн feedback-ийг тусган сайжруулах",
    ],
    requirements: roleExpectations,
    skills,
    applicantsCount,
    companyColor,
    hiringContact,
    contactRole: "Hiring manager",
  };
}

export const SAMPLE_JOBS: Job[] = [
  sample("sample-01", "График дизайнер ба сошиал медиа менежер", "Nomad House Studio", "Улаанбаатар", "on_site", "full_time", "₮3.0–4.5 сая / сар", "2026-08-15T07:30:00.000Z", "Өсөн нэмэгдэж буй creative багт брэндийн өнгө төрх, өдөр тутмын сошиал контентыг хариуцах дизайнер хайж байна.", ["Adobe Photoshop", "Illustrator", "Social media", "Branding"], 14, "#171717", "Наран Т."),
  sample("sample-02", "UX/UI дизайнер", "Tenger Tech", "Улаанбаатар · Hybrid", "hybrid", "full_time", "₮4.0–6.0 сая / сар", "2026-08-15T04:15:00.000Z", "B2B бүтээгдэхүүний туршлагыг илүү ойлгомжтой, хурдан болгох UX/UI дизайнер манай product багт нэгдэнэ.", ["Figma", "UX Research", "Design systems", "Prototyping"], 22, "#3157d6", "Мөнх-Оргил Б."),
  sample("sample-03", "3D Motion Artist", "Altan Frame", "Монгол · Remote", "remote", "freelance", "₮2.5–5.0 сая / төсөл", "2026-08-14T09:00:00.000Z", "Брэнд нээлт болон social campaign-д зориулсан 3D motion visual бүтээх freelance artist хайж байна.", ["Blender", "Cinema 4D", "After Effects", "3D Art"], 8, "#773ce8", "Саруул Г."),
  sample("sample-04", "Бүтээгдэхүүний гэрэл зурагчин", "Bayan Market", "Улаанбаатар", "on_site", "freelance", "₮1.8–3.2 сая / төсөл", "2026-08-14T03:30:00.000Z", "Хүнс, lifestyle бүтээгдэхүүний каталог болон campaign зураг авалт хийх photographer хэрэгтэй.", ["Photography", "Lightroom", "Retouching", "Studio lighting"], 11, "#d6603b", "Тэмүүлэн Д."),
  sample("sample-05", "Видео эвлүүлэгч", "Khangai Media", "Монгол · Remote", "remote", "freelance", "₮2.0–3.5 сая / сар", "2026-08-13T08:30:00.000Z", "YouTube болон short-form сувгуудад тогтмол ажиллах, storytelling мэдрэмжтэй video editor хайж байна.", ["Premiere Pro", "After Effects", "Storytelling", "Sound design"], 17, "#e23d7a", "Энхжин Ц."),
  sample("sample-06", "Брэнд стратегич", "Ulaan Creative", "Улаанбаатар · Hybrid", "hybrid", "full_time", "₮4.5–6.5 сая / сар", "2026-08-13T01:20:00.000Z", "Шинэ болон өсөн нэмэгдэж буй брэндүүдийн positioning, voice, campaign стратеги дээр ажиллана.", ["Brand Strategy", "Research", "Copywriting", "Presentation"], 6, "#007c70", "Ариунболд Э."),
  sample("sample-07", "Illustrator / Character Artist", "Tsagaan Bichig", "Монгол · Remote", "remote", "freelance", "₮1.5–3.0 сая / төсөл", "2026-08-12T07:00:00.000Z", "Хүүхдийн digital бүтээгдэхүүнд зориулсан character болон editorial illustration бүтээх artist хайж байна.", ["Illustration", "Character Design", "Procreate", "Photoshop"], 19, "#e79d21", "Ундрах О."),
  sample("sample-08", "Webflow хөгжүүлэгч", "Gobi Digital", "Монгол · Remote", "remote", "full_time", "₮3.5–5.5 сая / сар", "2026-08-12T03:45:00.000Z", "Figma загварыг production-ready marketing сайт болгон буулгах Webflow developer манай багт нэгдэнэ.", ["Webflow", "HTML/CSS", "SEO", "Figma"], 12, "#1969fb", "Гантулга Х."),
  sample("sample-09", "Interior Visualizer", "Orkhon Architects", "Улаанбаатар", "on_site", "full_time", "₮3.0–5.0 сая / сар", "2026-08-11T05:30:00.000Z", "Орон сууц, hospitality төслийн photorealistic visual болон material concept дээр ажиллах дизайнер хайж байна.", ["3ds Max", "V-Ray", "Interior Design", "AutoCAD"], 9, "#665d55", "Оюунгэрэл Н."),
  sample("sample-10", "Content Creator", "Hunnu Coffee", "Улаанбаатар", "on_site", "full_time", "₮2.5–3.8 сая / сар", "2026-08-11T01:00:00.000Z", "Кофены соёл, community-г богино видео болон photo story-оор харуулах бүтээлч хүн хайж байна.", ["Content Creation", "TikTok", "Photography", "Copywriting"], 27, "#8c5037", "Хулан Ж."),
  sample("sample-11", "Product Designer", "Salkhi Finance", "Улаанбаатар · Hybrid", "hybrid", "full_time", "₮5.0–7.0 сая / сар", "2026-08-10T08:00:00.000Z", "Санхүүгийн аппын дараагийн үеийн бүтээгдэхүүний UX болон interface-г хариуцах product designer авна.", ["Product Design", "Figma", "User Testing", "Mobile UI"], 15, "#126d9b", "Баттөр Д."),
  sample("sample-12", "Motion Graphic Designer", "Chinggis TV", "Улаанбаатар", "on_site", "full_time", "₮3.0–4.8 сая / сар", "2026-08-10T02:30:00.000Z", "Телевиз болон digital шоуны title package, promo motion-уудыг гаргах motion designer хайж байна.", ["After Effects", "Cinema 4D", "Broadcast", "Animation"], 10, "#b21e4b", "Туяа Э."),
  sample("sample-13", "Монгол бичгийн type designer", "Bichig Lab", "Монгол · Remote", "remote", "freelance", "₮3.0–6.0 сая / төсөл", "2026-08-09T06:30:00.000Z", "Орчин үеийн монгол бичгийн display typeface болон латин хослол хөгжүүлэх тусгай төсөл.", ["Typography", "Glyphs", "FontLab", "Монгол бичиг"], 4, "#23263d", "Билгүүн Л."),
  sample("sample-14", "Event Visual Designer", "Naadam Collective", "Улаанбаатар", "on_site", "freelance", "₮2.0–4.0 сая / төсөл", "2026-08-08T06:20:00.000Z", "Зуны томоохон event-ийн key visual, stage screen, social kit дээр ажиллах дизайнер хэрэгтэй.", ["Art Direction", "Illustrator", "Print Design", "Branding"], 13, "#ed542b", "Марал А."),
  sample("sample-15", "Sound Designer", "Khuvsgul Games", "Монгол · Remote", "remote", "freelance", "₮2.5–4.5 сая / төсөл", "2026-08-08T03:00:00.000Z", "Indie тоглоомын орчин, UI, character sound болон хөгжмийн жижиг хэсгүүд дээр ажиллана.", ["Sound Design", "FMOD", "Reaper", "Game Audio"], 7, "#3e2d6d", "Мишээл Р."),
  sample("sample-16", "Creative Copywriter", "Taliin Ads", "Улаанбаатар · Hybrid", "hybrid", "full_time", "₮3.0–4.5 сая / сар", "2026-08-07T07:40:00.000Z", "Campaign concept, film script, social copy болон brand voice гаргах copywriter хайж байна.", ["Copywriting", "Campaigns", "Storytelling", "Brand Voice"], 16, "#334859", "Энхмаа С."),
  sample("sample-17", "Fashion Stylist", "Khaan Atelier", "Улаанбаатар", "on_site", "freelance", "₮1.5–3.0 сая / зураг авалт", "2026-08-07T01:30:00.000Z", "Editorial болон e-commerce зураг авалтад seasonal styling шийдэл гаргах stylist хэрэгтэй.", ["Fashion", "Styling", "Editorial", "Art Direction"], 5, "#a87965", "Номин-Эрдэнэ Г."),
  sample("sample-18", "AR Filter Artist", "Kite Experience", "Монгол · Remote", "remote", "freelance", "₮2.0–3.5 сая / төсөл", "2026-08-06T05:00:00.000Z", "Brand activation-д зориулсан Instagram, TikTok AR filter хөгжүүлэх artist хайж байна.", ["Spark AR", "Effect House", "3D", "Interaction"], 11, "#00a6a0", "Эрдэнэбат Д."),
  sample("sample-19", "Junior Graphic Designer", "Ekhlel Agency", "Улаанбаатар", "on_site", "full_time", "₮1.8–2.8 сая / сар", "2026-08-05T08:00:00.000Z", "Agency багт суралцаж, social post, banner, presentation дээр ажиллах junior designer авна.", ["Photoshop", "Illustrator", "Layout", "Teamwork"], 31, "#427ec4", "Уянга П."),
  sample("sample-20", "Creative Director", "Steppe Ventures", "Улаанбаатар · Hybrid", "hybrid", "full_time", "₮6.0–9.0 сая / сар", "2026-08-03T04:00:00.000Z", "Олон улсын startup-уудын brand, product, launch campaign-ийг чиглүүлэх senior creative leader хайж байна.", ["Creative Direction", "Leadership", "Brand Strategy", "Product"], 3, "#1d2630", "Гэрэлмаа Ж."),
];
