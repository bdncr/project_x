"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { useAuth } from "../lib/AuthProvider";

type SiteHeaderProps = {
  activePage: "explore" | "jobs" | "people";
  onLogin: () => void;
  onSignOut?: () => void;
};

type HeaderMenu = "resources" | "hire" | "share" | "mail" | "bell" | "account";

export function SiteHeader({ activePage, onLogin, onSignOut }: SiteHeaderProps) {
  const { user, authReady, signOut } = useAuth();
  const handleSignOut = async () => { await signOut(); onSignOut?.(); closeMenu(); };
  const [openMenu, setOpenMenu] = useState<HeaderMenu | null>(null);

  const toggleMenu = (menu: HeaderMenu) => setOpenMenu((current) => current === menu ? null : menu);
  const closeMenu = () => setOpenMenu(null);
  const hoverOpen = (menu: HeaderMenu) => () => setOpenMenu(menu);
  const hoverClose = (menu: HeaderMenu) => () => setOpenMenu((current) => current === menu ? null : current);

  const initial = (user?.user_metadata.display_name || user?.email || "?").slice(0, 1).toUpperCase();
  const displayName = user?.user_metadata.display_name || user?.email?.split("@")[0] || "Project X хэрэглэгч";

  return <header className="site-header">
    <Link className="brand" href="/" aria-label="Project X home"><span>Project</span><b>X</b></Link>
    <nav aria-label="Үндсэн цэс">
      <Link className={activePage === "explore" ? "nav-active" : ""} href="/" onClick={closeMenu}>Судлах</Link>
      <Link className={activePage === "jobs" ? "nav-active" : ""} href="/jobs" onClick={closeMenu}>Ажлууд</Link>
      <div className="nav-dropdown" onMouseEnter={hoverOpen("resources")} onMouseLeave={hoverClose("resources")}>
        <button type="button" aria-expanded={openMenu === "resources"} onClick={() => toggleMenu("resources")}>Нөөц <Icon name="chevron" /></button>
        {openMenu === "resources" && <div className="nav-menu"><Link href="/#explore" onClick={closeMenu}>Тойм</Link><Link href="/#explore" onClick={closeMenu}>Карьерын гарын авлага</Link><Link href="/#explore" onClick={closeMenu}>Захиалгат төсөл</Link><Link href="/#explore" onClick={closeMenu}>Бүтээлч сургалт</Link></div>}
      </div>
      <span className="nav-divider" aria-hidden="true" />
      <div className="nav-dropdown" onMouseEnter={hoverOpen("hire")} onMouseLeave={hoverClose("hire")}>
        <button type="button" aria-expanded={openMenu === "hire"} onClick={() => toggleMenu("hire")}>Ажилтан авах <Icon name="chevron" /></button>
        {openMenu === "hire" && <div className="nav-menu"><Link href="/hire/jobs/create" onClick={closeMenu}>Фрийлансер хайх</Link><Link href="/#explore" onClick={closeMenu}>Үйлчилгээ хайх</Link><Link href="/jobs/create" onClick={closeMenu}>Ажлын зар оруулах</Link></div>}
      </div>
    </nav>
    <div className="header-actions">
      <div className="header-hover-menu share-hover" onMouseEnter={hoverOpen("share")} onMouseLeave={hoverClose("share")}>
        <button type="button" className="share-work" onClick={() => toggleMenu("share")} aria-expanded={openMenu === "share"}>Бүтээл нэмэх</button>
        {openMenu === "share" && <div className="nav-menu share-menu">
          <Link href="/project/create" onClick={closeMenu} className="share-menu-item">
            <span className="share-menu-icon"><Icon name="edit" /></span>
            <span><strong>Төсөл</strong><small>Дэлгэрэнгүй бүтээлээ нийтэл</small></span>
            <Icon name="arrow" />
          </Link>
          <Link href="/jobs/create" onClick={closeMenu} className="share-menu-item">
            <span className="share-menu-icon"><Icon name="briefcase" /></span>
            <span><strong>Ажлын зар</strong><small>Бүтээлч ажилтан хайж олоорой</small></span>
            <Icon name="arrow" />
          </Link>
        </div>}
      </div>

      {!authReady ? <span className="skeleton auth-skeleton" aria-hidden="true" /> : user ? <>
        <div className="header-hover-menu" onMouseEnter={hoverOpen("mail")} onMouseLeave={hoverClose("mail")}>
          <button className="header-icon" type="button" aria-label="Мессеж" aria-expanded={openMenu === "mail"} onClick={() => toggleMenu("mail")}><Icon name="mail" /></button>
          {openMenu === "mail" && <div className="header-menu-panel">
            <div className="header-menu-head"><h3>Зурвасууд</h3></div>
            <div className="header-menu-empty"><Icon name="mail" /><p>Танд одоогоор зурвас алга байна.</p></div>
          </div>}
        </div>
        <div className="header-hover-menu" onMouseEnter={hoverOpen("bell")} onMouseLeave={hoverClose("bell")}>
          <button className="header-icon" type="button" aria-label="Мэдэгдэл" aria-expanded={openMenu === "bell"} onClick={() => toggleMenu("bell")}><Icon name="bell" /></button>
          {openMenu === "bell" && <div className="header-menu-panel">
            <div className="header-menu-head"><h3>Мэдэгдлүүд</h3></div>
            <div className="header-menu-empty"><Icon name="bell" /><p>Одоогоор шинэ мэдэгдэл алга байна.</p></div>
          </div>}
        </div>
        <div className="header-hover-menu" onMouseEnter={hoverOpen("account")} onMouseLeave={hoverClose("account")}>
          <button type="button" className="account-avatar-btn" aria-label="Профайл" aria-expanded={openMenu === "account"} onClick={() => toggleMenu("account")}><span className="account-avatar">{initial}</span></button>
          {openMenu === "account" && <div className="account-panel">
            <div className="account-panel-head">
              <span className="account-avatar large">{initial}</span>
              <strong>{displayName}</strong>
              <span>{user.email}</span>
            </div>
            <Link href={`/profile/${user.id}`} className="account-panel-link" onClick={closeMenu}><Icon name="user" />Профайл</Link>
            <Link href={`/profile/${user.id}`} className="account-panel-link" onClick={closeMenu}><Icon name="briefcase" />Миний бүтээл</Link>
            <button type="button" className="account-panel-link danger" onClick={() => void handleSignOut()}><Icon name="logout" />Гарах</button>
          </div>}
        </div>
      </> : <button className="primary-link" type="button" onClick={onLogin}>Нэвтрэх</button>}
    </div>
  </header>;
}
