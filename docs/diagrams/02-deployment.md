# 2. Deployment / Infrastructure Diagram

Юу хаана ажилладаг, ямар тохиргоо шаардлагатай вэ.

```mermaid
flowchart TB
  subgraph Dev["Хөгжүүлэлтийн орчин"]
    D1["Хөгжүүлэгчийн компьютер<br/>Windows · Node 22"]
    D2["next dev — :3000<br/>Turbopack"]
    D3[".env.local<br/>NEXT_PUBLIC_SUPABASE_URL<br/>NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    D1 --> D2
    D3 --> D2
  end

  subgraph Prod["Продакшн (төлөвлөгөө)"]
    H1["Хостинг — Vercel<br/>эсвэл Node сервер"]
    H2["next build → next start"]
    H3["Орчны хувьсагч<br/>дашбоард дээрээс"]
    H1 --> H2
    H3 --> H2
  end

  subgraph SB["Supabase төсөл (үүл)"]
    SB1["Auth — GoTrue<br/>имэйл + нууц үг<br/>сэргээх линк"]
    SB2[("PostgreSQL<br/>11 хүснэгт · 1 view<br/>4 функц")]
    SB3["PostgREST<br/>REST API"]
    SB4["RLS бодлогууд<br/>+ table grants"]
    SB5["SQL Editor<br/>schema.sql · patch-*.sql"]
    SB3 --> SB2
    SB4 -.->|хамгаална| SB2
    SB5 -.->|гараар ажиллуулна| SB2
  end

  U["Хэрэглэгчийн хөтөч"]

  D2 -->|"@supabase/supabase-js<br/>anon key"| SB3
  D2 --> SB1
  H2 -->|HTTPS| SB3
  H2 --> SB1
  U -->|HTTPS| H2

  classDef cloud fill:#e8f1ff,stroke:#1769ff,color:#0b3c94
  class SB1,SB2,SB3,SB4,SB5 cloud
```

## Миграцийн дараалал

`supabase/` доторх файлууд. Шинэ өгөгдлийн сан бол `schema.sql`-ыг дээрээс доош нэг удаа
ажиллуулна. Аль хэдийн байгаа санд бол patch файлуудыг дарааллаар нь ажиллуулна.

```mermaid
flowchart LR
  S["schema.sql<br/>бүрэн бүтэц"] --> P1["patch-profile-directory.sql<br/>2026-08-24"]
  P1 --> P2["patch-project-comments.sql<br/>2026-08-28"]
  P2 --> P3["patch-job-offers.sql<br/>2026-08-28"]
  P3 --> N["patch-*.sql<br/>цаашид"]

  classDef done fill:#e6f6ec,stroke:#1a7f45,color:#0d4526
  classDef next fill:#f4f4f4,stroke:#aaa,color:#666,stroke-dasharray:4 3
  class S,P1,P2,P3 done
  class N next
```

> Бүх patch файл **idempotent** — дахин ажиллуулахад аюулгүй.
> Хүснэгт нэмэх бүрд RLS бодлого **ба** `grant` хоёуланг нь бичих ёстой: grant дутуу бол
> `permission denied for table` алдаа гарна.

## Хараахан байхгүй дэд бүтэц

| Юу | Одоо | Хэрэгтэй болбол |
|---|---|---|
| Файл хадгалалт | Байхгүй — бүх зураг гадаад URL | Supabase Storage bucket + RLS |
| Имэйл мэдэгдэл | Байхгүй | Supabase Edge Function эсвэл гуравдагч үйлчилгээ |
| Реал-тайм | Байхгүй — бүх өгөгдөл татаж авдаг | Supabase Realtime (зурвас, сэтгэгдэлд) |
| CDN зураг | Unsplash шууд | next/image + loader |
| CI/CD | Байхгүй | `npm run lint` (tsc) + `next build` |
