import { CONCEPT_BY_ID, isConceptId, type ConceptId } from "@/lib/curriculum";
import { notFound } from "next/navigation";
import { ConceptPage } from "./ConceptPageClient";

// Force per-request rendering so the 404 status code propagates correctly.
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isConceptId(id) || !CONCEPT_BY_ID[id]) {
    notFound();
  }
  return <ConceptPage id={id as ConceptId} />;
}