import { notFound } from "next/navigation";
import { getProjectByToken } from "@/lib/db";
import ProgressBar from "@/components/ProgressBar";

export const dynamic = "force-dynamic";

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const project = getProjectByToken(token);
  if (!project) notFound();

  const grouped = new Map<string, any[]>();
  for (const item of project.checklist) {
    if (!grouped.has(item.category)) grouped.set(item.category, []);
    grouped.get(item.category)!.push(item);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Closeout progress for {project.project_address || project.client_name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {project.flooring_types}
          {project.completion_date ? ` · Completed ${project.completion_date}` : ""}
        </p>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>
              {project.progress.done}/{project.progress.total} items complete
            </span>
            <span>{project.progress.percent}%</span>
          </div>
          <ProgressBar percent={project.progress.percent} />
        </div>

        {project.progress.percent === 100 && (
          <a
            href={`/api/projects/${project.id}/package`}
            className="btn btn-primary mt-4 w-full"
          >
            Download your closeout package (PDF)
          </a>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {Array.from(grouped.entries()).map(([category, items]) => (
          <div key={category} className="card p-5">
            <h2 className="mb-2 font-semibold text-brand-700">{category}</h2>
            <ul className="space-y-1.5">
              {items.map((item: any) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-800">{item.label}</span>
                  <span className={`badge badge-${item.status}`}>{item.status}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        Questions about anything above? Reply to your project email and we'll take a look.
      </p>
    </div>
  );
}
