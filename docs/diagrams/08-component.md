# 8. Component Diagram

React компонентын мод ба тэдгээрийн `lib/` хамаарал.

## 8.1 Төслийн маршрут (`/project/[id]`) — хамгийн нийлмэл хэсэг

```mermaid
flowchart TB
  P["app/project/[id]/page.tsx<br/><i>зөвхөн дэлгэц сонгоно</i>"]
  P -->|"id = new"| ED
  P -->|"?edit=1"| ED
  P -->|"бусад"| DV
  P -->|"Suspense fallback"| SK["CaseStudySkeleton"]

  subgraph View["Үзэх дэлгэц"]
    DV["ProjectDetailView"]
    DV --> AR["ActionRail"]
    DV --> BR["BlockRenderer"]
    DV --> SB["StoryBody"]
    DV --> AF["AppreciateFooter"]
    DV --> CS["CommentsSection"]
    DV --> MT["MetaTagsGrid"]
    DV --> IM["InviteCreatorModal"]
    DV --> AD["AuthDialog"]
    AR --> CHC["CreatorHoverCard"]
    AR --> THC["ToolsHoverCard"]
  end

  subgraph Editor["Засварлагч дэлгэц"]
    ED["ProjectEditorScreen"]
    ED --> ETB["EditorTopBar"]
    ED --> ESB["EditorSidebar"]
    ED --> BP["BlockPicker"]
    ED --> BEC["BlockEditorCanvas"]
    ED --> SM["SettingsModal"]
    ED --> PV["ProjectPreview"]
    BEC --> TBE["TextBlockEditor"]
    BEC --> IBE["ImageBlockEditor"]
    BEC --> PGE["PhotoGridBlockEditor"]
    BEC --> VBE["VideoBlockEditor"]
    BEC --> EBE["EmbedBlockEditor"]
  end

  subgraph Libs["lib/"]
    L1["project-crud"]
    L2["project-comments"]
    L3["invite-job → job-offers"]
    L4["creator-lookup"]
    L5["creative-tools"]
    L6["project-editor"]
    L7["use-hover-card"]
  end

  DV --> L1
  DV --> L2
  DV --> L3
  ED --> L1
  ED --> L6
  CHC --> L4
  CHC --> L7
  THC --> L5
  THC --> L7
  BEC --> L6

  classDef route fill:#e8f1ff,stroke:#1769ff,color:#0b3c94
  classDef lib fill:#fff4e5,stroke:#d98324,color:#7a4708
  class P route
  class L1,L2,L3,L4,L5,L6,L7 lib
```

## 8.2 Хуваалцсан бүрхүүл (бүх хуудсанд)

```mermaid
flowchart TB
  L["app/layout.tsx"] --> AP["AuthProvider<br/><i>user · authReady · signOut</i>"]
  AP --> PAGE["Хуудас бүр"]
  PAGE --> SH["SiteHeader"]
  PAGE --> SF["SiteFooter"]
  PAGE --> T["Toast"]
  PAGE --> ADg["AuthDialog<br/><i>ганц загвар</i>"]
  SH --> MM["MessagesMenu<br/><i>ажлын саналууд</i>"]
  SH --> IC["Icon"]
  MM --> JO["lib/job-offers"]
  ADg --> SIF["SignInForm"]
  ADg --> SUF["SignUpForm"]
  ADg --> FPF["ForgotPasswordForm"]
  SIF & SUF & FPF --> AF2["AuthFields"]
  ADg --> AA["lib/auth-actions"]
  AA --> SBC["lib/supabase"]
  AP --> SBC
```

## 8.3 Бусад маршрутууд

```mermaid
flowchart LR
  subgraph HomeR["/ — нүүр"]
    HP["app/page.tsx"]
    HP --> HS["HeroSection"]
    HP --> CR["CategoryRail"]
    HP --> TB["Toolbar → SearchBox · SearchSuggestions"]
    HP --> CG["ContentGrid → ContentCard"]
    HP --> SWF["ShareWorkForm"]
    HP --> MW["ManageWork"]
  end

  subgraph JobsR["/jobs"]
    JP["app/jobs/page.tsx"]
    JP --> JT["JobsTabs"]
    JP --> JS["JobsSidebar"]
    JP --> JDP["JobDetailPanel"]
    JP --> AppP["ApplicationPanel"]
    JP --> CM["ChoiceModal"]
  end

  subgraph PeopleR["/people · /profile/[id]"]
    PP["people/page · profile/[id]/page"]
    PP --> CC["CreatorGrid → CreatorCard"]
    PP --> HB["HireBanner"]
    PP --> PC2["ProfileCover · ProfileSidebar"]
    PP --> PT["ProfileTabs · ProfileWorkGrid"]
    PP --> PA["ProfileAbout · ProfileServices"]
    PP --> EPD["EditProfileDialog"]
  end

  subgraph SetR["/settings · /auth/*"]
    SP["settings/page"]
    SP --> SN["SettingsNav"]
    AR2["auth/forgot · auth/reset"]
    AR2 --> APC["AuthPageCard"]
  end
```

## 8.4 Загварын файлууд

| CSS файл | Хамрах хүрээ |
|---|---|
| `base-theme.css` | Глобал reset, өнгө, товч, оролтын талбар, footer, modal shell |
| `header-menus.css` | Толгой, унтраах цэс, "Бүтээл нэмэх" цэс, зурвасын панел |
| `explore-feed.css` | Нүүр галерей, карт, ангиллын мөр |
| `project-detail.css` | Төслийн хуудас, action rail, hover карт, сэтгэгдэл |
| `project-editor.css` | Блок засварлагч, тохиргооны цонх, preview |
| `jobs.css` | Ажлын самбар, бүх modal shell, ажлын саналын цонх |
| `jobs-hire-flow.css` | Зар нийтлэх маягт, AI туслах |
| `people.css` / `profile.css` | Бүтээгчийн карт, профайл |
| `settings.css` | Тохиргооны хуудас |

## 8.5 Хамаарлын дүрмүүд

```mermaid
flowchart TD
  R["app/*/page.tsx"] -->|"зөвхөн дэлгэц сонгоно"| C["components/*"]
  C -->|"өгөгдөл асууна"| L["lib/*"]
  L -->|"backend эсвэл localStorage"| D[("Өгөгдөл")]

  X1["❌ page → supabase шууд"]
  X2["❌ component → supabase шууд"]
  X3["❌ lib → React hook"]

  classDef bad fill:#fdeceb,stroke:#d3402a,color:#8a2718
  class X1,X2,X3 bad
```

> Ганц үл хамаарах зүйл: `lib/use-hover-card.ts` бол зориудаар hook — олон компонент
> ижил hover зан төлөвийг хуваалцахын тулд.
