"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "../../../../components/Icon";

const PREFILL_KEY = "project-x-hire-prompt";

export default function HireJobsCreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  function goToForm(event?: FormEvent) {
    event?.preventDefault();
    const value = prompt.trim();
    if (value) window.sessionStorage.setItem(PREFILL_KEY, value);
    else window.sessionStorage.removeItem(PREFILL_KEY);
    router.push("/jobs/create");
  }

  return <main className="jobs-page hire-flow-page">
    <div className="hire-flow-top">
      <Link className="job-form-back" href="/jobs"><Icon name="arrow" />Буцах</Link>
      <button type="button" className="hire-flow-skip" onClick={() => goToForm()}>AI-гүйгээр үүсгэх</button>
    </div>
    <div className="hire-flow-body">
      <h1>Та ямар ажилтан хайж байна вэ?</h1>
      <p>Хэдхэн үгээр юу хайж байгаагаа бичээрэй. Бид энэ мэдээллийг ашиглан ажлын зарын маягтыг урьдчилан бөглөх болно.</p>
      <form className="hire-flow-form" onSubmit={goToForm}>
        <span>Хайж байна:</span>
        <input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="ж: pet food брэндэд зориулсан illustrator, төсөв $800" />
        <button type="submit" aria-label="Үргэлжлүүлэх"><Icon name="arrow" /></button>
      </form>
    </div>
  </main>;
}
