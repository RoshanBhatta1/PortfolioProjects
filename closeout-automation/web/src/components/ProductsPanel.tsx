"use client";

import { useState } from "react";

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  not_searched: { text: "not searched", className: "bg-gray-100 text-gray-600" },
  searching: { text: "searching...", className: "bg-blue-100 text-blue-700" },
  found: { text: "documents found", className: "bg-brand-100 text-brand-700" },
  needs_review: { text: "needs review", className: "bg-amber-100 text-amber-700" },
  error: { text: "search failed", className: "bg-red-100 text-red-700" },
};

export default function ProductsPanel({
  projectId,
  products,
  onChange,
}: {
  projectId: string;
  products: any[];
  onChange: () => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ manufacturer: "", productLine: "", colourStyle: "", room: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy("add");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setForm({ manufacturer: "", productLine: "", colourStyle: "", room: "" });
      setAdding(false);
      await onChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleFind(productId: string) {
    setBusy(productId);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}/find-documents`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await onChange();
    } catch (err: any) {
      setError(err.message);
      await onChange();
    } finally {
      setBusy(null);
    }
  }

  async function handleFindAll() {
    setBusy("all");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/find-all-documents`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const failed = (data.results || []).filter((r: any) => !r.ok);
      if (failed.length) setError(`${failed.length} product(s) failed to search — see their notes below.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      await onChange();
      setBusy(null);
    }
  }

  async function handleDelete(productId: string) {
    setBusy(productId);
    try {
      await fetch(`/api/products/${productId}`, { method: "DELETE" });
      await onChange();
    } finally {
      setBusy(null);
    }
  }

  async function handleUpload(productId: string, kind: string, file: File) {
    setBusy(productId);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", kind);
      const res = await fetch(`/api/products/${productId}`, { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error);
      await onChange();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-brand-700">Products & Manufacturer Documents</h2>
          <p className="text-sm text-gray-500">
            Add each product installed, then let AI find the manufacturer&apos;s warranty and care
            documents. Review what it found before building the package.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-primary"
            disabled={busy !== null || products.length === 0}
            onClick={handleFindAll}
          >
            {busy === "all" ? "Finding for all products..." : "Find documents for all products"}
          </button>
          <button className="btn btn-secondary" onClick={() => setAdding((a) => !a)}>
            {adding ? "Cancel" : "+ Add product"}
          </button>
        </div>
      </div>

      {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {adding && (
        <form onSubmit={handleAdd} className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
          <input
            required
            placeholder="Manufacturer (e.g. Torlys)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.manufacturer}
            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
          />
          <input
            placeholder="Product line (e.g. EverWood Premier)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.productLine}
            onChange={(e) => setForm({ ...form, productLine: e.target.value })}
          />
          <input
            placeholder="Colour / style (optional)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.colourStyle}
            onChange={(e) => setForm({ ...form, colourStyle: e.target.value })}
          />
          <input
            placeholder="Room / area (optional)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
          />
          <button type="submit" disabled={busy === "add"} className="btn btn-primary col-span-2">
            {busy === "add" ? "Adding..." : "Add product"}
          </button>
        </form>
      )}

      {products.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          No products yet. Add the products installed on this job to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const status = STATUS_LABELS[p.search_status] || STATUS_LABELS.not_searched;
            const isBusy = busy === p.id || busy === "all";
            return (
              <div key={p.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      {[p.manufacturer, p.product_line, p.colour_style].filter(Boolean).join(" ")}
                    </div>
                    {p.room && <div className="text-xs text-gray-500">{p.room}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${status.className}`}>{isBusy ? "working..." : status.text}</span>
                    <button
                      className="btn btn-secondary text-xs"
                      disabled={isBusy}
                      onClick={() => handleFind(p.id)}
                    >
                      {p.search_status === "not_searched" ? "Find documents with AI" : "Search again"}
                    </button>
                    <button
                      className="text-xs text-gray-400 hover:text-red-600"
                      disabled={isBusy}
                      onClick={() => handleDelete(p.id)}
                    >
                      remove
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <DocumentSlot
                    label="Manufacturer warranty"
                    title={p.warranty_title}
                    url={p.warranty_url}
                    fileUrl={p.warranty_file_path ? `/api/products/${p.id}/file?kind=warranty` : null}
                    hasFile={Boolean(p.warranty_file_path)}
                    disabled={isBusy}
                    onUpload={(file) => handleUpload(p.id, "warranty", file)}
                  />
                  <DocumentSlot
                    label="Care & maintenance"
                    title={p.maintenance_title}
                    url={p.maintenance_url}
                    fileUrl={p.maintenance_file_path ? `/api/products/${p.id}/file?kind=maintenance` : null}
                    hasFile={Boolean(p.maintenance_file_path)}
                    disabled={isBusy}
                    onUpload={(file) => handleUpload(p.id, "maintenance", file)}
                  />
                </div>

                {p.search_notes && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-500">
                      What the AI reported
                    </summary>
                    <pre className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-600">
                      {p.search_notes}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DocumentSlot({
  label,
  title,
  url,
  fileUrl,
  hasFile,
  disabled,
  onUpload,
}: {
  label: string;
  title?: string | null;
  url?: string | null;
  fileUrl?: string | null;
  hasFile: boolean;
  disabled: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className={`rounded-lg border p-2 ${hasFile ? "border-brand-200 bg-brand-50" : "border-dashed border-gray-300"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className={`text-xs ${hasFile ? "text-brand-600" : "text-gray-400"}`}>
          {hasFile ? "attached" : "missing"}
        </span>
      </div>
      {title && <div className="mt-1 truncate text-xs text-gray-600">{title}</div>}
      {fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 block text-xs font-medium text-brand-700 hover:underline"
        >
          View attached PDF
        </a>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 block truncate text-xs text-gray-500 hover:underline"
        >
          Source: {url}
        </a>
      )}
      <label className="mt-1 inline-block cursor-pointer text-xs text-gray-500 hover:text-brand-600">
        {hasFile ? "replace with your own PDF" : "upload PDF manually"}
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={disabled}
          onChange={(e) => e.target.files && onUpload(e.target.files[0])}
        />
      </label>
    </div>
  );
}
