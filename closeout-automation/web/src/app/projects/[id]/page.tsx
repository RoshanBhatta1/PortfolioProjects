import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/db";
import ProjectDetailClient from "@/components/ProjectDetailClient";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) notFound();
  return <ProjectDetailClient initialProject={JSON.parse(JSON.stringify(project))} />;
}
