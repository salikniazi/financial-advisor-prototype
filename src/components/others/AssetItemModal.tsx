"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { OtherAsset } from "@/lib/types";

export default function AssetItemModal({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: OtherAsset;
  onClose: () => void;
  onSave: (item: OtherAsset) => void;
  onDelete: (id: string) => void;
}) {
  const [fields, setFields] = useState(item.fields);
  const [name, setName] = useState(item.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.type}</p>
            <h2 className="font-heading text-lg text-ink">{item.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <label className="mb-3 block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-ink/30"
            />
          </label>
          <div className="space-y-3">
            {Object.entries(fields).map(([key, value]) => (
              <label key={key} className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">{key}</span>
                <input
                  value={value}
                  onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-ink/30"
                />
              </label>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => onSave({ ...item, name, fields })}
              className="flex-1 rounded-full bg-yellow px-4 py-2.5 text-sm font-semibold text-ink hover:bg-yellow-dark"
            >
              Save Changes
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="flex items-center gap-1.5 rounded-full border border-red/30 px-4 py-2.5 text-sm font-semibold text-red hover:bg-red-bg"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
