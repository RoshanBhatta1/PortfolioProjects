"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCommercial, setIsCommercial] = useState(false);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    clientAddress: "",
    projectName: "",
    projectAddress: "",
    contractValue: "",
    startDate: "",
    completionDate: "",
    warrantyYears: "1",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, clientCompany: isCommercial ? form.clientCompany : "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");
      router.push(`/projects/${data.project.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">New Closeout Project</h1>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="flex gap-4 rounded-lg bg-gray-50 p-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={!isCommercial} onChange={() => setIsCommercial(false)} />
            Residential (client is the homeowner)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={isCommercial} onChange={() => setIsCommercial(true)} />
            Commercial (client is a GC / property manager)
          </label>
        </div>

        {isCommercial && (
          <Field
            label="Client company name *"
            value={form.clientCompany}
            onChange={(v) => update("clientCompany", v)}
            required={isCommercial}
            placeholder="e.g. GTA General Contractors Ltd."
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field
            label={isCommercial ? "Contact name (Attention) *" : "Client name *"}
            value={form.clientName}
            onChange={(v) => update("clientName", v)}
            required
            placeholder={isCommercial ? "e.g. Neetu Sharma" : undefined}
          />
          <Field label="Client email" value={form.clientEmail} onChange={(v) => update("clientEmail", v)} type="email" />
        </div>

        <TextArea
          label="Client mailing address (optional — for the letter's recipient block)"
          value={form.clientAddress}
          onChange={(v) => update("clientAddress", v)}
          placeholder={"54 Queen Street\nUnit 10B\nConcord, ON L4K 4H3"}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Project name (for the RE: line)"
            value={form.projectName}
            onChange={(v) => update("projectName", v)}
            placeholder="e.g. Pizza Carmelina"
          />
          <Field label="Project / site address" value={form.projectAddress} onChange={(v) => update("projectAddress", v)} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Contract value ($)" value={form.contractValue} onChange={(v) => update("contractValue", v)} type="number" />
          <Field label="Start date" value={form.startDate} onChange={(v) => update("startDate", v)} type="date" />
          <Field label="Completion date" value={form.completionDate} onChange={(v) => update("completionDate", v)} type="date" />
        </div>

        <Field
          label="Workmanship warranty (years)"
          value={form.warrantyYears}
          onChange={(v) => update("warrantyYears", v)}
          type="number"
        />

        <p className="text-xs text-gray-400">
          Your company letterhead (name, address, phone, signer) is set once under{" "}
          <a href="/settings" className="text-brand-600 hover:underline">
            Company Settings
          </a>{" "}
          rather than re-entered per project.
        </p>

        <button type="submit" disabled={saving} className="btn btn-primary w-full">
          {saving ? "Creating..." : "Create Project & Generate Checklist"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </label>
  );
}
