"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CaseStudySkeleton } from "../../../components/project/CaseStudySkeleton";
import { ProjectDetailView } from "../../../components/project/ProjectDetailView";
import { ProjectEditorScreen } from "../../../components/project/editor/ProjectEditorScreen";

/** The reserved id that opens a blank editor: /project/new. Nothing else in the app mints an
 * id that could collide with it — Postgres rows are uuids and demo drafts are "local-…". */
const CREATE_SEGMENT = "new";

function ProjectRoute() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  /* useSearchParams (not window.location) because the rail's Edit link is a client-side
     navigation within the same route: the query changes without this component remounting,
     and only the hook re-renders on that. Hence the Suspense boundary below. */
  const editRequested = useSearchParams()?.has("edit") ?? false;

  if (id === CREATE_SEGMENT) return <ProjectEditorScreen mode="create" />;
  if (editRequested && id) return <ProjectEditorScreen mode="edit" projectId={id} />;
  return <ProjectDetailView id={id} />;
}

/**
 * The single project route. All four CRUD operations hang off this one path:
 *
 *   /project/new          create   → blank editor
 *   /project/<id>         read     → case study
 *   /project/<id>?edit=1  update   → editor loaded with that project (owner only)
 *   delete                         → action rail on the case study
 *
 * The page itself only picks a screen. Each branch is its own component so neither has to
 * carry the other's hooks, and the two stay independently readable.
 */
export default function ProjectRoutePage() {
  return <Suspense fallback={<CaseStudySkeleton />}><ProjectRoute /></Suspense>;
}
