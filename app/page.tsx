"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type ContentStatus = "published" | "draft";
type SortMode = "recommended" | "recent" | "liked" | "viewed";

type ContentItem = {
  id: string;
  title: string;
  creator: string;
  role: string;
  category: string;
  summary: string;
  coverUrl: string;
  likes: number;
  views: number;
  saved: boolean;
  status: ContentStatus;
  createdAt: string;
};

type ContentForm = Omit<ContentItem, "id" | "likes" | "views" | "saved" | "createdAt">;

type SupabaseProject = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  cover_url: string;
  is_published: boolean | null;
  published_at: string | null;
};

const storageKey = "project-x-content-v2";

const categories = ["Бүгд", "Брэнд", "График", "Гэрэл зураг", "Зураглал", "UX/UI", "3D", "Motion"];

const defaultItems: ContentItem[] = [
  {
    id: "seed-1",
    title: "Нүүдэлчдийн орчин",
    creator: "Selenge Studio",
    role: "Брэнд систем",
    category: "Брэнд",
    summary: "Орчин үеийн Монгол брэндийн өнгө, тэмдэг, хэв маягийг нэгэн цул систем болгосон кейс.",
    coverUrl: "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=1200&q=88",
    likes: 428,
    views: 8240,
    saved: false,
    status: "published",
    createdAt: "2026-08-01",
  },
  {
    id: "seed-2",
    title: "Тэнгэрийн бичиг",
    creator: "Номин Б.",
    role: "Үсгийн дизайн",
    category: "График",
    summary: "Монгол бичгийн хөдөлгөөн, орон зайг дижитал постер болон үсгийн туршилтад буулгасан ажил.",
    coverUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=88",
    likes: 192,
    views: 3920,
    saved: true,
    status: "published",
    createdAt: "2026-08-03",
  },
  {
    id: "seed-3",
    title: "Ulaanbaatar 2040",
    creator: "Jiguur Lab",
    role: "3D концепц",
    category: "3D",
    summary: "Ирээдүйн хотын гэрэл, хөдөлгөөн, нийтийн орчны концепц судалгаа.",
    coverUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=88",
    likes: 817,
    views: 12040,
    saved: false,
    status: "draft",
    createdAt: "2026-08-05",
  },
  {
    id: "seed-4",
    title: "Өглөөний зах",
    creator: "Arvan Frame",
    role: "Гэрэл зураг",
    category: "Гэрэл зураг",
    summary: "Хотын өглөөний өнгө, жижиг бизнес, хүмүүсийн хөдөлгөөнийг баримтат цувралаар харуулсан төсөл.",
    coverUrl: "https://images.unsplash.com/photo-1517457210348-703079e57d4b?auto=format&fit=crop&w=1200&q=88",
    likes: 316,
    views: 5410,
    saved: false,
    status: "published",
    createdAt: "2026-08-07",
  },
];

const emptyForm: ContentForm = {
  title: "",
  creator: "",
  role: "",
  category: "Брэнд",
  summary: "",
  coverUrl: "",
  status: "published",
};

function Icon({ name }: { name: "search" | "plus" | "edit" | "trash" | "close" | "heart" | "eye" | "save" | "upload" | "spark" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.3" /><path d="m16 16 4 4" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    edit: <><path d="m14 5 5 5" /><path d="M4 20h5L19 10a3.5 3.5 0 0 0-5-5L4 15v5Z" /></>,
    trash: <><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 14h10l1-14" /><path d="M9 7V4h6v3" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    heart: <path d="M12 20s-8-4.7-8-10.4A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 8 1.6C20 15.3 12 20 12 20Z" />,
    eye: <><path d="M3 12s3.2-5.5 9-5.5 9 5.5 9 5.5-3.2 5.5-9 5.5S3 12 3 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    save: <><path d="M6 4h12v17l-6-3-6 3V4Z" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function normalizeForm(form: ContentForm): ContentForm {
  return {
    ...form,
    title: form.title.trim(),
    creator: form.creator.trim(),
    role: form.role.trim(),
    summary: form.summary.trim(),
    coverUrl: form.coverUrl.trim() || "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=88",
  };
}

export default function Home() {
  const [items, setItems] = useState<ContentItem[]>(defaultItems);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Бүгд");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const cached = window.localStorage.getItem(storageKey);
    if (cached) {
      setItems(JSON.parse(cached) as ContentItem[]);
    }
    setLoaded(true);

    if (!supabase) return;

    supabase
      .from("projects")
      .select("id,title,description,category,cover_url,is_published,published_at")
      .order("published_at", { ascending: false })
      .then((response: { data: SupabaseProject[] | null }) => {
        const projects = response.data ?? [];
        if (!projects.length) return;

        setItems(projects.map((project) => ({
          id: project.id,
          title: project.title,
          creator: "Project X",
          role: "Контент",
          category: project.category,
          summary: project.description ?? "",
          coverUrl: project.cover_url,
          likes: 0,
          views: 0,
          saved: false,
          status: project.is_published ? "published" : "draft",
          createdAt: project.published_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        })));
      });
  }, []);

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, loaded]);

  const visibleItems = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    const filtered = items.filter((item) => {
      const matchesCategory = activeCategory === "Бүгд" || item.category === activeCategory;
      const searchable = `${item.title} ${item.creator} ${item.role} ${item.category} ${item.summary}`.toLocaleLowerCase();
      return matchesCategory && searchable.includes(term);
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "recent") return b.createdAt.localeCompare(a.createdAt);
      if (sortMode === "liked") return b.likes - a.likes;
      if (sortMode === "viewed") return b.views - a.views;
      return b.likes + b.views / 20 - (a.likes + a.views / 20);
    });
  }, [activeCategory, items, query, sortMode]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const editItem = (item: ContentItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      creator: item.creator,
      role: item.role,
      category: item.category,
      summary: item.summary,
      coverUrl: item.coverUrl,
      status: item.status,
    });
    document.getElementById("share")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openItem = (item: ContentItem) => {
    setSelected({ ...item, views: item.views + 1 });
    setItems((current) => current.map((content) => content.id === item.id ? { ...content, views: content.views + 1 } : content));
  };

  const toggleLike = (id: string) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, likes: item.likes + 1 } : item));
    notify("Талархал нэмэгдлээ.");
  };

  const toggleSave = (id: string) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, saved: !item.saved } : item));
  };

  const deleteItem = (id: string) => {
    const item = items.find((content) => content.id === id);
    if (!item) return;

    const confirmed = window.confirm(`"${item.title}" контентыг устгах уу?`);
    if (!confirmed) return;

    setItems((current) => current.filter((content) => content.id !== id));
    if (selected?.id === id) setSelected(null);
    if (editingId === id) resetForm();
    notify("Контент устлаа.");
  };

  const saveContent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextForm = normalizeForm(form);
    if (!nextForm.title || !nextForm.creator || !nextForm.role || !nextForm.summary) {
      notify("Гарчиг, бүтээгч, төрөл, тайлбарыг бөглөнө үү.");
      return;
    }

    if (editingId) {
      setItems((current) => current.map((item) => item.id === editingId ? { ...item, ...nextForm } : item));
      notify("Контент шинэчлэгдлээ.");
      resetForm();
      return;
    }

    const newItem: ContentItem = {
      ...nextForm,
      id: crypto.randomUUID(),
      likes: 0,
      views: 0,
      saved: false,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setItems((current) => [newItem, ...current]);
    notify("Шинэ контент нийтлэгдлээ.");
    resetForm();
  };

  const publishedCount = items.filter((item) => item.status === "published").length;
  const draftCount = items.length - publishedCount;
  const savedCount = items.filter((item) => item.saved).length;

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Project X нүүр хуудас">
          <span>Project</span><b>X</b>
        </a>
        <nav aria-label="Үндсэн цэс">
          <a href="#explore">Судлах</a>
          <a href="#share">Ажил нэмэх</a>
          <a href="#manage">Удирдах</a>
        </nav>
        <a className="primary-link" href="#share"><Icon name="upload" /> Share Work</a>
      </header>

      <section id="top" className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-copy">
          <p className="kicker">Монгол бүтээлчдийн нээлттэй галерей</p>
          <h1>Project X</h1>
          <p>Бүтээлээ оруулж, засаж, ноорог болгож, устгаж, бусдын ажлыг судалдаг Behance маягийн контент платформ.</p>
          <div className="hero-actions">
            <a href="#share" className="hero-button"><Icon name="plus" /> Контент үүсгэх</a>
            <a href="#explore" className="secondary-button">Галерей харах</a>
          </div>
        </div>
      </section>

      <section className="stats-row" aria-label="Контентын төлөв">
        <div><span>{items.length}</span><p>Нийт бүтээл</p></div>
        <div><span>{publishedCount}</span><p>Нийтлэгдсэн</p></div>
        <div><span>{draftCount}</span><p>Ноорог</p></div>
        <div><span>{savedCount}</span><p>Хадгалсан</p></div>
      </section>

      <section id="explore" className="explore-section">
        <div className="section-title">
          <p>Explore</p>
          <h2>Бүтээлүүд</h2>
        </div>

        <div className="toolbar">
          <label className="search-box">
            <Icon name="search" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Project X дээр хайх..." />
          </label>
          <div className="filter-scroll" aria-label="Ангилал">
            {categories.map((category) => (
              <button key={category} className={activeCategory === category ? "filter active" : "filter"} onClick={() => setActiveCategory(category)}>
                {category}
              </button>
            ))}
          </div>
          <div className="sort-tabs" aria-label="Эрэмбэлэх">
            <button className={sortMode === "recommended" ? "active" : ""} onClick={() => setSortMode("recommended")}>Санал болгох</button>
            <button className={sortMode === "recent" ? "active" : ""} onClick={() => setSortMode("recent")}>Шинэ</button>
            <button className={sortMode === "liked" ? "active" : ""} onClick={() => setSortMode("liked")}>Талархал</button>
            <button className={sortMode === "viewed" ? "active" : ""} onClick={() => setSortMode("viewed")}>Үзэлт</button>
          </div>
        </div>

        <div className="content-grid">
          {visibleItems.map((item) => (
            <article className="content-card" key={item.id}>
              <button className="image-button" onClick={() => openItem(item)} aria-label={`${item.title} дэлгэрэнгүй харах`}>
                <img src={item.coverUrl} alt="" />
                <span className={item.status === "published" ? "status published" : "status"}>{item.status === "published" ? "Нийтэлсэн" : "Ноорог"}</span>
              </button>
              <div className="card-body">
                <div className="card-topline">
                  <p>{item.category}</p>
                  <button className={item.saved ? "icon-action active" : "icon-action"} onClick={() => toggleSave(item.id)} aria-label="Хадгалах">
                    <Icon name="save" />
                  </button>
                </div>
                <h3>{item.title}</h3>
                <span>{item.creator} · {item.role}</span>
                <div className="card-stats">
                  <button onClick={() => toggleLike(item.id)}><Icon name="heart" /> {compactNumber(item.likes)}</button>
                  <span><Icon name="eye" /> {compactNumber(item.views)}</span>
                </div>
                <div className="card-actions">
                  <button onClick={() => editItem(item)}><Icon name="edit" /> Засах</button>
                  <button className="danger-button" onClick={() => deleteItem(item.id)}><Icon name="trash" /> Устгах</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {visibleItems.length === 0 && (
          <div className="empty-state">
            <h3>Илэрц алга</h3>
            <p>Хайлтаа өөрчлөх эсвэл шинэ контент нэмээрэй.</p>
            <button onClick={() => { setQuery(""); setActiveCategory("Бүгд"); }}>Шүүлт цэвэрлэх</button>
          </div>
        )}
      </section>

      <section id="share" className="editor-section">
        <div className="section-title">
          <p>Share Work</p>
          <h2>{editingId ? "Контент засах" : "Шинэ контент үүсгэх"}</h2>
        </div>

        <form className="editor-card" onSubmit={saveContent}>
          <label>
            Гарчиг
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Жишээ: Шинэ брэнд систем" />
          </label>
          <label>
            Бүтээгч
            <input value={form.creator} onChange={(event) => setForm({ ...form, creator: event.target.value })} placeholder="Студи эсвэл хүний нэр" />
          </label>
          <label>
            Төрөл
            <input value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="UX/UI, зураглал, гэрэл зураг..." />
          </label>
          <label>
            Ангилал
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {categories.filter((category) => category !== "Бүгд").map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>
            Төлөв
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ContentStatus })}>
              <option value="published">Нийтлэх</option>
              <option value="draft">Ноорог</option>
            </select>
          </label>
          <label className="wide-field">
            Зургийн URL
            <input value={form.coverUrl} onChange={(event) => setForm({ ...form, coverUrl: event.target.value })} placeholder="https://..." />
          </label>
          <label className="wide-field">
            Тайлбар
            <textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="Контентын богино тайлбар..." rows={5} />
          </label>
          <div className="preview-panel">
            <div className="mini-preview">
              <img src={form.coverUrl || "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=900&q=88"} alt="" />
              <p>{form.title || "Гарчиг харагдана"}</p>
              <span>{form.creator || "Бүтээгч"} · {form.category}</span>
            </div>
          </div>
          <div className="form-actions wide-field">
            <button type="submit"><Icon name="upload" /> {editingId ? "Шинэчлэх" : "Нийтлэх"}</button>
            {editingId && <button type="button" className="ghost-button" onClick={resetForm}><Icon name="close" /> Болих</button>}
          </div>
        </form>
      </section>

      <section id="manage" className="manage-section">
        <div className="section-title">
          <p>CRUD</p>
          <h2>Миний контент</h2>
        </div>
        <div className="manage-list">
          {items.map((item) => (
            <article key={item.id} className="manage-row">
              <img src={item.coverUrl} alt="" />
              <div>
                <h3>{item.title}</h3>
                <p>{item.creator} · {item.category} · {item.status === "published" ? "Нийтэлсэн" : "Ноорог"}</p>
              </div>
              <span>{compactNumber(item.likes)} талархал</span>
              <button onClick={() => editItem(item)} aria-label="Засах"><Icon name="edit" /></button>
              <button className="danger-icon" onClick={() => deleteItem(item.id)} aria-label="Устгах"><Icon name="trash" /></button>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <a className="brand" href="#top"><span>Project</span><b>X</b></a>
        <p>© 2026 Project X. Улаанбаатар.</p>
        <span>{supabase ? "Supabase холболт илэрлээ" : "Одоогоор frontend localStorage дээр хадгалж байна"}</span>
      </footer>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)} role="presentation">
          <section className="content-modal" onClick={(event) => event.stopPropagation()} aria-modal="true" role="dialog" aria-label={selected.title}>
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Хаах"><Icon name="close" /></button>
            <img src={selected.coverUrl} alt="" />
            <div className="modal-copy">
              <p>{selected.category} · {selected.status === "published" ? "Нийтэлсэн" : "Ноорог"}</p>
              <h2>{selected.title}</h2>
              <span>{selected.creator} · {selected.role}</span>
              <p>{selected.summary}</p>
              <div className="modal-stats">
                <span><Icon name="heart" /> {compactNumber(selected.likes)}</span>
                <span><Icon name="eye" /> {compactNumber(selected.views)}</span>
              </div>
              <div className="card-actions">
                <button onClick={() => toggleLike(selected.id)}><Icon name="heart" /> Талархах</button>
                <button onClick={() => { editItem(selected); setSelected(null); }}><Icon name="edit" /> Засах</button>
                <button className="danger-button" onClick={() => deleteItem(selected.id)}><Icon name="trash" /> Устгах</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
