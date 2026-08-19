import { Icon } from "../Icon";

export function HeroSection() {
  return <section id="top" className="hero">
    <div className="hero-media" aria-hidden="true" />
    <div className="hero-copy">
      <p className="kicker">Монгол бүтээлчдийн нээлттэй галерей</p>
      <h1>Project X</h1>
      <p>Бүтээлээ нийтэлж, цуглуулж, бүтээлчдийн ажлыг нээж харах нэг цэгийн платформ.</p>
      <div className="hero-actions">
        <a href="#share" className="hero-button"><Icon name="plus" /> Бүтээл нэмэх</a>
        <a href="#explore" className="secondary-button">Галерей харах</a>
      </div>
    </div>
  </section>;
}
