# 3. Entity Relationship Diagram (ERD)

`supabase/schema.sql`-ийн бодит бүтэц. Бүх хүснэгт дээр RLS идэвхтэй.

```mermaid
erDiagram
  profiles ||--o{ projects : "эзэмшинэ"
  profiles ||--o{ project_likes : "талархана"
  profiles ||--o{ project_saves : "хадгална"
  profiles ||--o{ project_comments : "бичнэ"
  profiles ||--o{ job_posts : "нийтэлнэ"
  profiles ||--o{ job_saves : "хадгална"
  profiles ||--o{ job_applications : "хүсэлт илгээнэ"
  profiles ||--o{ job_offers : "санал илгээнэ"
  profiles ||--o{ job_offers : "санал хүлээн авна"
  profiles ||--o{ profile_follows : "дагана"

  projects ||--o{ project_likes : "талархагдана"
  projects ||--o{ project_saves : "хадгалагдана"
  projects ||--o{ project_comments : "сэтгэгдэлтэй"
  projects ||--o{ job_offers : "үүсгэсэн"

  job_posts ||--o{ job_saves : "хадгалагдана"
  job_posts ||--o{ job_applications : "хүсэлттэй"
  job_posts ||--o{ job_offers : "үүссэн зар"

  profiles {
    uuid id PK "auth.users-тэй нэг id"
    text username UK
    text display_name
    text headline
    text location
    text_array employment_tags
    boolean is_pro
    text cover_url
    timestamptz created_at
  }

  projects {
    uuid id PK
    uuid owner_id FK "null бол seed"
    text external_key UK
    text title
    text role
    text description
    text category
    text cover_url
    jsonb body_blocks "блок засварлагчийн агуулга"
    text custom_button_label
    text custom_button_url
    text_array tags
    text visibility "everyone | private"
    boolean is_mature
    boolean comments_disabled
    text license
    integer view_count
    boolean is_published
    timestamptz published_at
    timestamptz created_at
  }

  project_likes {
    uuid project_id PK
    uuid user_id PK
    timestamptz created_at
  }

  project_saves {
    uuid project_id PK
    uuid user_id PK
    timestamptz created_at
  }

  project_comments {
    uuid id PK
    uuid project_id FK
    uuid author_id FK
    text body "1-1000 тэмдэгт"
    timestamptz created_at
  }

  profile_follows {
    uuid follower_id PK
    uuid followee_id PK
    timestamptz created_at
  }

  job_posts {
    uuid id PK
    uuid owner_id FK
    text external_key UK
    text title
    text company
    text location
    text work_mode "remote | hybrid | on_site"
    text employment_type "freelance | full_time | contract"
    text salary_text
    text description
    text_array responsibilities
    text_array requirements
    text_array skills
    text company_color
    text hiring_contact
    text contact_role
    integer applicants_count "триггерээр шинэчлэгдэнэ"
    text status "draft | active | closed"
    timestamptz published_at
    timestamptz closing_at
  }

  job_saves {
    uuid job_id PK
    uuid user_id PK
    timestamptz created_at
  }

  job_applications {
    uuid id PK
    uuid job_id FK
    uuid applicant_id FK
    text cover_letter
    text status "submitted | reviewing | shortlisted | rejected | withdrawn"
    timestamptz created_at
  }

  job_offers {
    uuid id PK
    uuid job_id FK "устгавал null"
    uuid project_id FK "устгавал null"
    uuid sender_id FK
    uuid recipient_id FK
    text title
    text budget
    text note "хувийн захиас"
    timestamptz created_at
    timestamptz read_at "null бол уншаагүй"
    text status "pending | accepted | declined"
    text reply "бүтээгчийн хариу"
    timestamptz responded_at
  }
```

## Нэмэлт объектууд

| Объект | Төрөл | Зориулалт |
|---|---|---|
| `profile_directory` | View (`security_invoker`) | Хүмүүс хуудсанд зориулж талархал/үзэлт/дагагч/thumbnail-ыг нэгтгэсэн |
| `increment_project_views(uuid)` | Function | Төслийн үзэлт нэмэх, нийтлэгдсэн эсвэл өөрийн төсөл дээр л ажиллана |
| `handle_new_user()` | Trigger | Шинэ хэрэглэгч бүртгэгдэхэд `profiles` мөр автоматаар үүсгэнэ |
| `set_updated_at()` | Trigger | `updated_at` талбарыг автоматаар шинэчилнэ |
| `sync_job_applicant_count()` | Trigger | `job_posts.applicants_count`-ыг хүсэлтийн тоотой синк хийнэ |

## RLS хураангуй

| Хүснэгт | Унших | Бичих | Устгах |
|---|---|---|---|
| `profiles` | бүгд | зөвхөн өөрийнх | — |
| `projects` | нийтлэгдсэн эсвэл өөрийнх | зөвхөн өөрийнх | зөвхөн өөрийнх |
| `project_likes` | бүгд | зөвхөн өөрийнх | зөвхөн өөрийнх |
| `project_saves` | **зөвхөн эзэн** | зөвхөн өөрийнх | зөвхөн өөрийнх |
| `project_comments` | бүгд | өөрийнх, зөвхөн нээлттэй төсөлд (`comments_disabled` RLS-ээр хаана) | зохиогч **эсвэл төслийн эзэн** |
| `profile_follows` | бүгд | зөвхөн өөрийнх | зөвхөн өөрийнх |
| `job_posts` | бүгд | зөвхөн өөрийнх | зөвхөн өөрийнх |
| `job_saves` / `job_applications` | зөвхөн өөрийнх (+ зарын эзэн) | зөвхөн өөрийнх | зөвхөн өөрийнх |
| `job_offers` | **зөвхөн илгээгч ба хүлээн авагч** | илгээгч (insert) · хүлээн авагч (хариу) | хоёулаа |

> `job_offers` бол цорын ганц **бүрэн хаалттай** хүснэгт: төсөв, хувийн захиас агуулдаг тул
> `anon` эрх огт өгөөгүй.

## Цаашид нэмэгдэж болох

```mermaid
erDiagram
  profiles ||--o{ notifications : "хүлээн авна"
  profiles ||--o{ messages : "бичнэ"
  profiles ||--o{ profile_services : "санал болгоно"

  notifications {
    uuid id PK
    uuid user_id FK
    text kind "like | follow | comment | offer"
    uuid subject_id
    timestamptz read_at
  }
  messages {
    uuid id PK
    uuid thread_id
    uuid sender_id FK
    text body
  }
  profile_services {
    uuid id PK
    uuid owner_id FK
    text title
    text price_text
  }
```
