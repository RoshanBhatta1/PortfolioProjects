"use client";

import { useMemo, useState } from "react";
import ProgressBar from "./ProgressBar";

const STATUS_OPTIONS = ["pending", "uploaded", "verified", "waived"] as const;

const DRAFT_LABELS: Record<string, string> = {
  workmanship_warranty: "workmanship warranty letter",
  care_guide: "care & maintenance guide",
  cover_letter: "cover letter",
  outstanding_email: "outstanding items email",
};

export default function ProjectDetailClient({ initialProject }: { initialProject: any }) {
  const [project, setProject] = useState(initialProject);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moistureText, setMoistureText] = useState("");
  const [moistureResult, setMoistureResult] = useState<any>(null);
  const [outstandingDraft, setOutstandingDraft] = useState<string | null>(null);
  const [statusUrl, setStatusUrl] = useState("");

  useState(() => {
    if (typeof window !== "undefined") {
      setStatusUrl(`${window.location.origin}/status/${project.public_token}`);
    }
  });

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of project.checklist) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return Array.from(map.entries());
  }, [project.checklist]);

  const latestDraftByType = useMemo(() => {
    const map = new Map<string, any>();
    for (const d of project.drafts) {
      if (!map.has(d.draft_type)) map.set(d.draft_type, d);
    }
    return map;
  }, [project.drafts]);

  async function refresh() {
    const res = await fetch(`/api/projects/${project.id}`);
    const data = await res.json();
    if (res.ok) setProject(data.project);
  }

  async function handleStatusChange(itemId: string, status: string) {
    setBusyItem(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyItem(null);
    }
  }

  async function handleNotesSave(itemId: string, notes: string) {
    setBusyItem(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyItem(null);
    }
  }

  async function handleUpload(itemId: string, file: File) {
    setBusyItem(itemId);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/projects/${project.id}/checklist/${itemId}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyItem(null);
    }
  }

  async function handleGenerateDraft(draftType: string, itemId?: string) {
    setBusyItem(itemId || draftType);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/ai-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (draftType === "outstanding_email") setOutstandingDraft(data.draft.content);
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyItem(null);
    }
  }

  async function handleMoistureExtract() {
    setBusyItem("moisture-extract");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/moisture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: moistureText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMoistureResult(data.extraction);
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyItem(null);
    }
  }

  return (
    <div>
      <div className="mb-6 card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{project.client_name}</h1>
            <div className="mt-1 text-sm text-gray-500">
              {project.project_address || "No address on file"}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {project.flooring_types || "Flooring type not specified"}
              {project.completion_date ? ` · Completed ${project.completion_date}` : ""}
              {` · ${project.warranty_years || 1} yr workmanship warranty`}
            </div>
          </div>
          <a
            href={`/api/projects/${project.id}/package`}
            className="btn btn-primary"
            target="_blank"
            rel="noreferrer"
          >
            Download Closeout Package (PDF)
          </a>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>
              {project.progress.done}/{project.progress.total} items closed out
            </span>
            <span>{project.progress.percent}%</span>
          </div>
          <ProgressBar percent={project.progress.percent} />
        </div>

        {statusUrl && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            <span className="font-medium">Client status link:</span>
            <code className="flex-1 truncate">{statusUrl}</code>
            <button
              className="btn btn-secondary px-2 py-1 text-xs"
              onClick={() => navigator.clipboard.writeText(statusUrl)}
            >
              Copy
            </button>
          </div>
        )}
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mb-6 card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium text-gray-900">Outstanding items follow-up</h2>
            <p className="text-sm text-gray-500">
              Draft a client email listing everything still needed before the package can ship.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            disabled={busyItem === "outstanding_email"}
            onClick={() => handleGenerateDraft("outstanding_email")}
          >
            {busyItem === "outstanding_email" ? "Drafting..." : "Draft with AI"}
          </button>
        </div>
        {outstandingDraft && (
          <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
            {outstandingDraft}
          </pre>
        )}
      </div>

      <div className="space-y-6">
        {grouped.map(([category, items]) => (
          <div key={category} className="card p-5">
            <h2 className="mb-3 font-semibold text-brand-700">{category}</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  busy={busyItem === item.id}
                  draft={item.draft_type ? latestDraftByType.get(item.draft_type) : undefined}
                  onStatusChange={(status) => handleStatusChange(item.id, status)}
                  onNotesSave={(notes) => handleNotesSave(item.id, notes)}
                  onUpload={(file) => handleUpload(item.id, file)}
                  onGenerateDraft={
                    item.draft_type ? () => handleGenerateDraft(item.draft_type, item.id) : undefined
                  }
                  draftBusy={busyItem === item.id}
                  extra={
                    item.key === "moisture-test" ? (
                      <div className="mt-3 rounded-lg border border-dashed border-gray-300 p-3">
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Paste raw moisture test report text to auto-extract the reading
                        </label>
                        <textarea
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                          rows={3}
                          value={moistureText}
                          onChange={(e) => setMoistureText(e.target.value)}
                        />
                        <button
                          className="btn btn-secondary mt-2"
                          disabled={busyItem === "moisture-extract" || !moistureText}
                          onClick={handleMoistureExtract}
                        >
                          {busyItem === "moisture-extract" ? "Extracting..." : "Extract with AI"}
                        </button>
                        {moistureResult && (
                          <div className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-700">
                            <div>
                              <strong>Method:</strong> {moistureResult.testMethod || "unknown"}
                            </div>
                            <div>
                              <strong>Reading:</strong> {moistureResult.reading || "unknown"}
                            </div>
                            <div>
                              <strong>Result:</strong> {moistureResult.passFail}
                            </div>
                            <div>{moistureResult.summary}</div>
                          </div>
                        )}
                      </div>
                    ) : undefined
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 card p-5">
        <h2 className="mb-3 font-semibold text-gray-900">Activity</h2>
        <ul className="space-y-1 text-sm text-gray-500">
          {project.activity.map((a: any) => (
            <li key={a.id}>
              <span className="text-gray-400">{new Date(a.created_at).toLocaleString("en-CA")}</span> — {a.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChecklistItem({
  item,
  busy,
  draft,
  onStatusChange,
  onNotesSave,
  onUpload,
  onGenerateDraft,
  draftBusy,
  extra,
}: {
  item: any;
  busy: boolean;
  draft?: any;
  onStatusChange: (status: string) => void;
  onNotesSave: (notes: string) => void;
  onUpload: (file: File) => void;
  onGenerateDraft?: () => void;
  draftBusy: boolean;
  extra?: React.ReactNode;
}) {
  const [notes, setNotes] = useState(item.notes || "");
  const [showDraft, setShowDraft] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{item.label}</span>
            {!item.required ? <span className="badge badge-pending">optional</span> : null}
          </div>
          {item.description && <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>}
        </div>
        <select
          value={item.status}
          disabled={busy}
          onChange={(e) => onStatusChange(e.target.value)}
          className={`badge badge-${item.status} border-0`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="btn btn-secondary cursor-pointer text-xs">
          {item.file_name ? "Replace file" : "Upload file"}
          <input
            type="file"
            className="hidden"
            onChange={(e) => e.target.files && onUpload(e.target.files[0])}
          />
        </label>
        {item.file_name && (
          <a href={`/api/uploads/${item.id}`} className="text-xs text-brand-600 hover:underline">
            {item.file_name}
          </a>
        )}

        {onGenerateDraft && (
          <button className="btn btn-secondary text-xs" disabled={draftBusy} onClick={onGenerateDraft}>
            {draftBusy ? "Drafting..." : draft ? "Regenerate with AI" : "Generate with AI"}
          </button>
        )}
        {draft && (
          <button className="text-xs text-brand-600 hover:underline" onClick={() => setShowDraft((s) => !s)}>
            {showDraft ? "Hide draft" : "View draft"}
          </button>
        )}
      </div>

      {showDraft && draft && (
        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-800">
          {draft.content}
        </pre>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs"
          placeholder="Notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (item.notes || "") && onNotesSave(notes)}
        />
      </div>

      {extra}
    </div>
  );
}
