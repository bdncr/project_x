# 1. System Architecture Diagram

Системийн ерөнхий бүтэц — давхаргууд ба тэдгээрийн хоорондын өгөгдлийн урсгал.

**Гол зарчим:** UI компонент шууд Supabase рүү хандахгүй. Бүх өгөгдлийн ажиллагаа `lib/`
давхаргаар дамжина, тэр давхарга нь backend байгаа эсэхийг шийдэж, байхгүй бол localStorage
руу шилжинэ (demo горим).

```mermaid
flowchart TB
  subgraph Browser["Хөтөч (Client)"]
    direction TB

    subgraph Routes["App Router — app/"]
      R1["/ нүүр галерей"]
      R2["/project/[id]<br/>view · new · edit"]
      R3["/jobs · /jobs/create"]
      R4["/people · /profile/[id]"]
      R5["/settings · /auth/*"]
    end

    subgraph UI["Компонент давхарга — components/"]
      C1["SiteHeader · SiteFooter<br/>MessagesMenu"]
      C2["project/*<br/>DetailView · Rail · Comments<br/>HoverCards · InviteModal"]
      C3["project/editor/*<br/>BlockEditor · SettingsModal"]
      C4["jobs/* · people/* · profile/*"]
      C5["auth/* — AuthDialog"]
    end

    subgraph Lib["Домэйн давхарга — lib/"]
      L1["project-crud<br/>project-comments"]
      L2["invite-job · job-offers<br/>jobs-data"]
      L3["creator-lookup<br/>profile-work"]
      L4["auth-actions<br/>AuthProvider"]
      L5["*-samples<br/>demo өгөгдөл"]
    end

    subgraph Store["Хөтөч дэх хадгалалт"]
      S1[("localStorage<br/>demo төсөл · сэтгэгдэл<br/>санал · ажил · хайлтын түүх")]
    end
  end

  subgraph Supabase["Supabase (үүл)"]
    A1["Auth<br/>GoTrue"]
    P1[("PostgreSQL<br/>RLS идэвхтэй")]
    P2["PostgREST API"]
    P3["profile_directory<br/>view"]
    P4["increment_project_views<br/>RPC"]
  end

  Routes --> UI
  UI --> Lib
  L4 --> A1
  L1 --> P2
  L2 --> P2
  L3 --> P2
  L3 --> P3
  L1 -.->|"backend алга"| S1
  L2 -.->|"backend алга"| S1
  L5 --> S1
  P2 --> P1
  P3 --> P1
  P4 --> P1
  L1 --> P4

  classDef cloud fill:#e8f1ff,stroke:#1769ff,color:#0b3c94
  classDef local fill:#fff4e5,stroke:#d98324,color:#7a4708
  class A1,P1,P2,P3,P4 cloud
  class S1 local
```

## Давхаргын хариуцлага

| Давхарга | Хариуцлага | Хийж болохгүй зүйл |
|---|---|---|
| `app/` (route) | Зөвхөн аль дэлгэцийг үзүүлэхээ шийднэ | Өгөгдөл татах, бизнес логик |
| `components/` | Харагдах байдал, хэрэглэгчийн оролт | Supabase руу шууд хандах |
| `lib/` | Өгөгдлийн ажиллагаа, backend/demo сонголт | React hook (`use-hover-card`-с бусад) |
| Supabase | Хадгалалт, эрхийн хяналт (RLS) | — |

## Хоёр горим

```mermaid
flowchart LR
  ENV{"NEXT_PUBLIC_SUPABASE_URL<br/>+ ANON_KEY байна уу?"}
  ENV -->|Тийм| B["Backend горим<br/>Postgres + Auth<br/>RLS хамгаална"]
  ENV -->|Үгүй| D["Demo горим<br/>localStorage + seed өгөгдөл<br/>нэвтрэлт шаардахгүй"]
  B --> M["Холимог: uuid биш id<br/>(seed-*, local-*) үргэлж<br/>localStorage дээр үлдэнэ"]
  D --> M
```
