# 7. Class Diagram

TypeScript домэйн загварууд (`lib/`). Классын оронд `type` ашигладаг тул талбаруудыг класс
хэлбэрээр, функцуудыг модуль хэлбэрээр дүрсэлсэн.

## 7.1 Домэйн төрлүүд

```mermaid
classDiagram
  class ContentItem {
    +string id
    +string ownerId
    +string title
    +string creator
    +string role
    +string category
    +string summary
    +string coverUrl
    +number likes
    +number views
    +boolean saved
    +boolean liked
    +ContentStatus status
    +string createdAt
    +ProjectBlock[] blocks
    +string customButtonLabel
    +string customButtonUrl
    +string[] tags
    +ProjectVisibility visibility
    +boolean isMature
    +boolean commentsDisabled
    +string license
  }

  class ProjectBlock {
    <<union>>
    +string id
    +BlockType type
  }
  class TextBlock { +string html }
  class ImageBlock { +string url +string caption }
  class PhotoGridBlock { +string[] urls }
  class VideoBlock { +string url }
  class EmbedBlock { +string url +EmbedKind kind }

  class ProjectComment {
    +string id
    +string projectId
    +string authorId
    +string author
    +string text
    +string createdAt
  }

  class Creator {
    +string id
    +string name
    +string role
    +string category
    +string location
    +boolean isPro
    +string[] tags
    +number appreciations
    +number followers
    +number projectViews
    +number projectCount
    +string[] thumbnails
    +string coverUrl
  }

  class Job {
    +string id
    +string title
    +string company
    +string location
    +WorkMode workMode
    +EmploymentType employmentType
    +string salary
    +string description
    +string[] responsibilities
    +string[] requirements
    +string[] skills
    +number applicantsCount
    +boolean isLocal
  }

  class JobOffer {
    +string id
    +string jobId
    +string projectId
    +string senderId
    +string senderName
    +string recipientId
    +string title
    +string budget
    +string note
    +string createdAt
    +string readAt
  }

  class InviteForm {
    +string title
    +string[] categories
    +string budget
    +string description
    +string note
    +HiringFor hiringFor
    +string companyName
    +string companyWebsite
    +string companyLogoUrl
  }

  class ProjectDraft {
    +string title
    +string role
    +string category
    +string coverUrl
    +string summary
    +ProjectBlock[] blocks
    +string buttonLabel
    +string buttonUrl
    +string[] tags
    +ProjectVisibility visibility
    +boolean isMature
    +boolean commentsDisabled
    +string license
  }

  ProjectBlock <|-- TextBlock
  ProjectBlock <|-- ImageBlock
  ProjectBlock <|-- PhotoGridBlock
  ProjectBlock <|-- VideoBlock
  ProjectBlock <|-- EmbedBlock
  ContentItem "1" o-- "0..*" ProjectBlock
  ContentItem "1" o-- "0..*" ProjectComment
  ProjectDraft ..> ContentItem : хадгалахад хөрвүүлнэ
  InviteForm ..> JobOffer : sendInvite үүсгэнэ
  InviteForm ..> Job : job_posts үүсгэнэ
  JobOffer "0..*" --> "1" Creator : хүлээн авагч
```

## 7.2 Тоочсон төрлүүд (enums)

```mermaid
classDiagram
  class ContentStatus {
    <<enumeration>>
    published
    draft
  }
  class ProjectVisibility {
    <<enumeration>>
    everyone
    private
  }
  class BlockType {
    <<enumeration>>
    text
    image
    photo_grid
    video
    embed
  }
  class EmbedKind {
    <<enumeration>>
    embed
    prototype
    kind_3d
  }
  class WorkMode {
    <<enumeration>>
    remote
    hybrid
    on_site
  }
  class EmploymentType {
    <<enumeration>>
    freelance
    full_time
    contract
  }
  class HiringFor {
    <<enumeration>>
    personal
    company
  }
  class AuthMode {
    <<enumeration>>
    signin
    signup
    reset
  }
```

> **Тэмдэглэл:** `EmbedKind.kind_3d` нь кодод `"3d"` гэсэн утгатай — mermaid-ийн
> classDiagram цифрээр эхэлсэн гишүүний нэрийг зөвшөөрдөггүй тул ингэж бичсэн.

## 7.3 lib модулиуд ба тэдгээрийн функцууд

```mermaid
classDiagram
  class project_crud {
    <<module>>
    +loadProjectForEdit(id, userId) LoadForEditResult
    +saveProject(options) SaveProjectResult
    +deleteProject(id) string
    +isRemoteProject(id) boolean
    +PROJECT_CATEGORIES
    +DEFAULT_PROJECT_COVER
  }
  class project_comments {
    <<module>>
    +fetchComments(projectId)
    +createComment(projectId, text, author)
    +deleteComment(comment)
    +commentsAreRemote(projectId)
    +MAX_COMMENT_LENGTH
  }
  class project_editor {
    <<module>>
    +createBlock(type, kind) ProjectBlock
    +sanitizeRichText(html) string
    +safeEmbedUrl(raw) string
    +normalizeVideoEmbedUrl(raw) string
    +cleanBlocksForSave(blocks)
    +deriveSummaryFromBlocks(blocks)
    +firstImageFromBlocks(blocks)
  }
  class invite_job {
    <<module>>
    +sendInvite(options) SendInviteResult
    +buildInviteJobForm(form, inviter, creator) JobForm
    +validateInvite(form) InviteErrors
    +BUDGET_OPTIONS
    +MAX_INVITE_CATEGORIES
  }
  class job_offers {
    <<module>>
    +sendOffer(input) string
    +fetchInbox(userId)
    +markOffersRead(userId, offers)
    +canDeliverRemotely(recipientId)
  }
  class jobs_data {
    <<module>>
    +buildJobInsertPayload(form, color, contact)
    +buildLocalJob(form, color, contact) Job
    +loadDemoJobs() Job[]
    +mapJob(row) Job
  }
  class creator_lookup {
    <<module>>
    +fetchCreatorSummary(ownerId, name) Creator
  }
  class project_samples {
    <<module>>
    +loadDemoProjects() ContentItem[]
    +addLocalProject(item)
    +updateLocalProject(id, patch)
    +removeLocalProject(id)
    +toolsForCategory(category)
    +projectGallery(coverUrl)
  }
  class supabase_client {
    <<module>>
    +supabase SupabaseClient | null
  }

  project_crud --> project_samples
  project_crud --> project_editor
  project_crud --> supabase_client
  project_comments --> supabase_client
  invite_job --> jobs_data
  invite_job --> job_offers
  job_offers --> supabase_client
  creator_lookup --> supabase_client
```

## 7.4 Ерөнхий хэв маяг

Бүх өгөгдлийн модуль ижил гурван зарчмыг баримтална:

```mermaid
flowchart LR
  A["Дуудлага<br/>fetch / save / delete"] --> B{"isRemote(id)?<br/>supabase байна уу<br/>+ id нь uuid уу?"}
  B -->|Тийм| C["PostgREST хүсэлт<br/>RLS шалгана"]
  B -->|Үгүй| D["localStorage<br/>demo өгөгдөл"]
  C --> E["{ data, error } буцаана"]
  D --> E
```
