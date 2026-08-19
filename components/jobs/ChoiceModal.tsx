import Link from "next/link";
import { Icon } from "../Icon";

export function ChoiceModal({ onClose }: { onClose: () => void }) {
  return <div className="jobs-modal-backdrop" onClick={onClose}>
    <section className="jobs-modal choice-modal" onClick={(event) => event.stopPropagation()}>
      <button className="jobs-modal-close" onClick={onClose}><Icon name="close" /></button>
      <p className="modal-kicker">Шинэ ажил</p>
      <h2>Юу хийхийг хүсэж байна вэ?</h2>
      <div className="choice-grid">
        <div className="choice-card highlight">
          <p className="modal-kicker">Freelance</p>
          <h3>Фрийлансер хөлслөх</h3>
          <p className="choice-copy">Тохирох бүтээлчийг хэдхэн минутанд ол.</p>
          <ul>
            <li><Icon name="check" />Хэрэгцээндээ тохирсон саналуудыг ав</li>
            <li><Icon name="check" />Шууд мессеж бичиж, файл солилцох</li>
            <li><Icon name="check" />Картаар аюулгүй, шуурхай төлбөр хийх</li>
          </ul>
          <Link className="apply" href="/hire/jobs/create">Одоо хайж эхлэх <Icon name="arrow" /></Link>
        </div>
        <div className="choice-card">
          <p className="modal-kicker">Бүтэн цаг / Гэрээт</p>
          <h3>Ажлын зар байршуулах</h3>
          <p className="choice-copy">Бүтэн цаг эсвэл гэрээт ажлын байрны зараа нийтэл.</p>
          <ul>
            <li><Icon name="check" />Сая гаруй бүтээлчид зараа хүргэ</li>
            <li><Icon name="check" />Ирсэн хүсэлтүүдийг удирдах</li>
            <li><Icon name="check" />Шууд холбогдож ажилд авах</li>
          </ul>
          <Link className="save-job" href="/jobs/create">Зар байршуулах</Link>
        </div>
      </div>
    </section>
  </div>;
}
