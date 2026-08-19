import type { FormEvent } from "react";
import { Icon } from "../Icon";
import type { Job } from "../../lib/job-samples";

type ApplicationPanelProps = {
  selected: Job;
  step: "location" | "form";
  onConfirmLocation: () => void;
  onDeclineLocation: () => void;
  coverLetter: string;
  onCoverLetterChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  applicantName: string;
  applicantInitial: string;
};

/** The right-hand slide-in panel for confirming location fit and submitting a job application. */
export function ApplicationPanel({ selected, step, onConfirmLocation, onDeclineLocation, coverLetter, onCoverLetterChange, onSubmit, onClose, applicantName, applicantInitial }: ApplicationPanelProps) {
  return <aside className="application-panel" aria-label="Ажлын хүсэлт">
    <div className="application-panel-head">
      <div><p className="modal-kicker">Project X Jobs</p><h2>{step === "location" ? "Ажлын байршлыг баталгаажуулах" : "Энэ ажилд хүсэлт илгээх"}</h2></div>
      <button className="application-panel-close" onClick={onClose} aria-label="Хаах"><Icon name="close" /></button>
    </div>
    {step === "location" ? <div className="location-check">
      <span className="location-check-icon"><Icon name="pin" /></span>
      <h3>Энэ ажил {selected.location}-д on-site байна.</h3>
      <p>Таны профайлын байршил Монгол гэж харагдаж байна. Та энэ байршлаас ажиллах боломжтой юу?</p>
      <div><button className="apply" onClick={onConfirmLocation}>Тийм, боломжтой</button><button className="location-decline" onClick={onDeclineLocation}>Үгүй, тохирохгүй</button></div>
    </div> : <form className="application-form" onSubmit={onSubmit}>
      <p className="application-caption">Таны Project X профайл болон доорх message ажил олгогчид очно.</p>
      <section className="applicant-profile"><span className="applicant-avatar">{applicantInitial}</span><div><strong>{applicantName}</strong><span>Монгол</span></div></section>
      <section className="profile-experience"><div><strong>Туршлага</strong><button type="button">Профайлаа гүйцээх</button></div><p><Icon name="spark" />Профайл дээр таны ажлын туршлага хараахан нэмэгдээгүй байна.</p></section>
      <label className="application-message">Таны message<textarea value={coverLetter} onChange={(event) => onCoverLetterChange(event.target.value)} rows={8} placeholder="Яагаад энэ ажил танд тохирохыг, ямар туршлагаа ашиглахыг товч бичнэ үү..." /></label>
      <label className="application-consent"><input required type="checkbox" /> <span>Миний Project X профайлыг ажил олгогчид харагдуулахыг зөвшөөрч байна.</span></label>
      <button className="modal-submit" type="submit">Хүсэлт илгээх <Icon name="arrow" /></button>
    </form>}
  </aside>;
}
