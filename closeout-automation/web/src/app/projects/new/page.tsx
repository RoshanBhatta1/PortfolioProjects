"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    projectAddress: "",
    flooringTypes: "",
    contractValue: "",
    startDate: "",
    completionDate: "",
    warrantyYears: "1",
    contractorName: "",
    contractorContact: "",
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
        body: JSON.stringify(form),
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Client name *" value={form.clientName} onChange={(v) => update("clientName", v)} required />
          <Field label="Client email" value={form.clientEmail} onChange={(v) => update("clientEmail", v)} type="email" />
        </div>

        <Field label="Project address" value={form.projectAddress} onChange={(v) => update("projectAddress", v)} />
        <Field
          label="Flooring type(s) installed"
          value={form.flooringTypes}
          onChange={(v) => update("flooringTypes", v)}
          placeholder="e.g. Engineered hardwood (living/dining), LVP (basement)"
        />

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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Contractor / company name" value={form.contractorName} onChange={(v) => update("contractorName", v)} />
          <Field label="Contractor contact info" value={form.contractorContact} onChange={(v) => update("contractorContact", v)} />
        </div>

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
