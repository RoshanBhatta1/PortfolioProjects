import Link from "next/link";
import { listProjects } from "@/lib/db";
import ProgressBar from "@/components/ProgressBar";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const projects = listProjects();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Closeout Projects</h1>
        <Link href="/projects/new" className="btn btn-primary">
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          No projects yet. Create your first closeout project to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((p: any) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="card block p-5 hover:border-brand-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{p.client_name}</div>
                  <div className="text-sm text-gray-500">
                    {p.project_address || "No address on file"}
                    {p.flooring_types ? ` · ${p.flooring_types}` : ""}
                  </div>
                </div>
                <span className="badge badge-uploaded">{p.status.replace("_", " ")}</span>
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>
                    {p.progress.done}/{p.progress.total} items closed out
                  </span>
                  <span>{p.progress.percent}%</span>
                </div>
                <ProgressBar percent={p.progress.percent} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
