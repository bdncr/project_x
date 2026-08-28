# 4. Sequence Diagrams

Системийн гол таван үйл явцын дараалал.

---

## 4.1 Ажлын санал илгээх (хамгийн нийлмэл урсгал)

```mermaid
sequenceDiagram
  actor E as Ажил олгогч
  participant DV as ProjectDetailView
  participant M as InviteCreatorModal
  participant IJ as lib/invite-job
  participant JO as lib/job-offers
  participant DB as Supabase
  actor C as Бүтээгч

  E->>DV: "Ажлын санал" дарна
  DV->>DV: isOwner шалгана
  alt Өөрийн бүтээл
    DV-->>E: "Өөрийн бүтээлд ажлын санал илгээх боломжгүй."
  else Нэвтрээгүй
    DV-->>E: AuthDialog нээнэ
  else Зөв
    DV->>M: Цонх нээнэ
    E->>M: Гарчиг · ангилал · төсөв · тайлбар · захиас
    M->>M: validateInvite()
    alt Гарчиг хоосон
      M-->>E: "Ажлын нэр оруулна уу."
    else
      M->>DV: onSubmit(form)
      DV->>IJ: sendInvite(form, recipientId, projectId)
      IJ->>IJ: buildInviteJobForm()<br/>захиасыг тайлбарт нэмнэ
      IJ->>DB: insert job_posts
      DB-->>IJ: job.id
      IJ->>JO: sendOffer(jobId, recipientId, ...)
      JO->>DB: insert job_offers
      DB-->>JO: ok
      JO-->>IJ: null (алдаагүй)
      IJ-->>DV: { error: null }
      DV-->>E: "Ажлын санал илгээгдэж, зар үүслээ."
    end
  end

  Note over C,DB: Дараа нь бүтээгч орох үед
  C->>DB: fetchInbox(userId)
  DB-->>C: job_offers жагсаалт
  C->>C: Улаан цэг + Зурвасууд панел
```

---

## 4.2 Төсөл нийтлэх (create) ба засах (update)

```mermaid
sequenceDiagram
  actor U as Бүтээгч
  participant R as "app/project/[id]/page"
  participant ED as ProjectEditorScreen
  participant PC as lib/project-crud
  participant DB as Supabase

  alt Шинэ төсөл
    U->>R: /project/new
    R->>ED: mode="create"
  else Засах
    U->>R: /project/[id]?edit=1
    R->>ED: mode="edit", projectId
    ED->>PC: loadProjectForEdit(id, userId)
    PC->>DB: select projects where id
    DB-->>PC: мөр
    alt Эзэн нь өөр хүн
      PC-->>ED: forbidden
      ED-->>U: "Зөвхөн өөрийн бүтээлийг засна."<br/>төслийн хуудас руу буцаана
    else
      PC-->>ED: item + dates
      ED->>ED: Талбар, блокуудыг дүүргэнэ
    end
  end

  U->>ED: Блок нэмэх / текст бичих / тохиргоо
  U->>ED: "Нийтлэх" эсвэл "Шинэчлэх"
  ED->>ED: Гарчиг, төрөл, тайлбар шалгана
  alt Дутуу
    ED-->>U: Алдаа + Тохиргоо цонх нээнэ
  else
    ED->>PC: saveProject({ editingId, draft, status })
    alt editingId байгаа
      PC->>DB: update projects where id and owner_id
    else
      PC->>DB: insert projects
    end
    DB-->>PC: id
    PC-->>ED: { id }
    ED->>R: router.push(/project/id)
  end
```

---

## 4.3 Сэтгэгдэл бичих

```mermaid
sequenceDiagram
  actor V as Зочин
  participant CS as CommentsSection
  participant DV as ProjectDetailView
  participant PC as lib/project-comments
  participant DB as Supabase

  Note over DV: Хуудас нээгдэхэд
  DV->>PC: fetchComments(projectId)
  alt uuid биш id (seed / local)
    PC->>PC: localStorage-оос уншина
  else
    PC->>DB: select project_comments + profiles
    DB-->>PC: мөрүүд
  end
  PC-->>DV: { comments, error }
  DV->>CS: жагсаалт үзүүлнэ

  V->>CS: Текст бичээд "Сэтгэгдэл нэмэх"
  CS->>DV: onPostComment()
  DV->>DV: requireUser()
  alt Нэвтрээгүй
    DV-->>V: AuthDialog
  else
    DV->>PC: createComment(projectId, text, author)
    PC->>DB: insert project_comments
    DB-->>PC: шинэ мөр
    PC-->>DV: comment
    DV->>CS: Жагсаалтын эхэнд нэмнэ
    DV-->>V: "Сэтгэгдэл нэмэгдлээ."
  end
```

---

## 4.4 Нэвтрэх ба сесс сэргээх

```mermaid
sequenceDiagram
  actor U as Хэрэглэгч
  participant AP as AuthProvider
  participant AD as AuthDialog
  participant AA as lib/auth-actions
  participant SB as "Supabase Auth"

  Note over AP: Апп ачаалахад
  AP->>SB: getSession()
  SB-->>AP: session эсвэл null
  AP->>AP: authReady = true
  AP->>SB: onAuthStateChange(...) сонсоно

  U->>AD: Имэйл + нууц үг → "Нэвтрэх"
  AD->>AA: runAuthSubmit({ mode: "signin" })
  AA->>SB: signInWithPassword()
  alt Амжилттай
    SB-->>AA: session
    SB->>AP: onAuthStateChange(SIGNED_IN)
    AP->>AP: setUser()
    AA-->>AD: { close: true, message }
    AD->>AD: Цонх хаана
  else Алдаа
    SB-->>AA: error
    AA-->>AD: { close: false, message }
    AD-->>U: Алдааны мессеж
  end

  Note over SB,AP: Нууц үг сэргээх линк дарахад
  SB->>AP: onAuthStateChange(PASSWORD_RECOVERY)
  AP->>AP: router.push("/auth/reset")
```

---

## 4.5 Ажилд хүсэлт илгээх

```mermaid
sequenceDiagram
  actor A as Ажил хайгч
  participant JP as "app/jobs"
  participant AppP as ApplicationPanel
  participant DB as Supabase

  A->>JP: Ажил сонгоно
  A->>JP: "Хүсэлт илгээх"
  JP->>JP: Нэвтэрсэн эсэх
  alt Нэвтрээгүй
    JP-->>A: "Хадгалах, хүсэлт илгээхийн тулд нэвтэрнэ үү."
  else
    JP->>AppP: Самбар нээнэ
    opt On-site ажил
      AppP-->>A: "Ажлын байршлыг баталгаажуулах"
      A->>AppP: "Тийм, боломжтой"
    end
    A->>AppP: Cover letter бичнэ → "Хүсэлт илгээх"
    AppP->>DB: insert job_applications
    alt Давхардсан (unique job_id + applicant_id)
      DB-->>AppP: conflict
      AppP-->>A: "Та энэ ажилд хүсэлт илгээсэн байна."
    else
      DB-->>AppP: ok
      DB->>DB: trigger → applicants_count +1
      AppP-->>A: "Хүсэлт амжилттай илгээгдлээ."
    end
  end
```
