"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    companyName: "",
    addressLine1: "",
    cityProvincePostal: "",
    phone: "",
    fax: "",
    email: "",
    tagline: "",
    signerName: "",
    signerTitle: "",
    defaultWarrantyYears: "1",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings;
        setForm({
          companyName: s.company_name || "",
          addressLine1: s.address_line1 || "",
          cityProvincePostal: s.city_province_postal || "",
          phone: s.phone || "",
          fax: s.fax || "",
          email: s.email || "",
          tagline: s.tagline || "",
          signerName: s.signer_name || "",
          signerTitle: s.signer_title || "",
          defaultWarrantyYears: String(s.default_warranty_years || 1),
        });
        setLoading(false);
      });
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Company Settings</h1>
      <p className="mb-6 text-sm text-gray-500">
        This letterhead information is set once and used on every closeout letter — you won&apos;t
        need to re-enter it per project.
      </p>
      <form onSubmit={handleSave} className="card space-y-4 p-6">
        <Field label="Company name" value={form.companyName} onChange={(v) => update("companyName", v)} />
        <Field label="Address" value={form.addressLine1} onChange={(v) => update("addressLine1", v)} />
        <Field
          label="City, Province, Postal Code"
          value={form.cityProvincePostal}
          onChange={(v) => update("cityProvincePostal", v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
          <Field label="Fax (optional)" value={form.fax} onChange={(v) => update("fax", v)} />
        </div>
        <Field label="Email" value={form.email} onChange={(v) => update("email", v)} type="email" />
        <Field
          label="Tagline (optional)"
          value={form.tagline}
          onChange={(v) => update("tagline", v)}
          placeholder="e.g. Our Service Builds Relationships"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Signer name" value={form.signerName} onChange={(v) => update("signerName", v)} />
          <Field label="Signer title" value={form.signerTitle} onChange={(v) => update("signerTitle", v)} />
        </div>
        <Field
          label="Default warranty period (years)"
          value={form.defaultWarrantyYears}
          onChange={(v) => update("defaultWarrantyYears", v)}
          type="number"
        />

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
          {saved && <span className="text-sm text-brand-600">Saved</span>}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
    </label>
  );
}
