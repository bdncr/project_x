import { SiteHeader } from "../SiteHeader";
import { SiteFooter } from "../SiteFooter";
import { supabase } from "../../lib/supabase";

/** The grey cover-and-lines placeholder, shown while a case study is being fetched. */
export function CaseStudySkeletonBody() {
  return <div className="case-skeleton" aria-hidden="true">
    <span className="skeleton case-skeleton-cover" />
    <div className="case-skeleton-body">
      <span className="skeleton skeleton-line" style={{ width: "40%", height: 34 }} />
      <span className="skeleton skeleton-line" style={{ width: "60%", marginTop: 16 }} />
      <span className="skeleton skeleton-line" style={{ width: "90%", marginTop: 28, height: 400, borderRadius: 8 }} />
    </div>
  </div>;
}

/** The whole page shell around that placeholder. This is the route's Suspense fallback: the
 * project route reads the URL's query with useSearchParams, which hands everything below the
 * boundary to the client, so without a fallback the server would send an empty document and
 * the page would flash blank before hydrating. */
export function CaseStudySkeleton() {
  return <main className="case-page">
    <SiteHeader activePage="explore" onLogin={() => {}} />
    <CaseStudySkeletonBody />
    <SiteFooter backendConnected={!!supabase} />
  </main>;
}
