import Link from "next/link";

export function SiteFooter({ homeHref = "/", backendConnected }: { homeHref?: string; backendConnected: boolean }) {
  return <footer>
    <Link className="brand" href={homeHref}><span>Project</span><b>X</b></Link>
    <p>© 2026 Project X. Улаанбаатар.</p>
    <span>{backendConnected ? "Supabase backend холбогдсон" : "Backend тохируулаагүй"}</span>
  </footer>;
}
