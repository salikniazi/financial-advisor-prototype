"use client";

import { useEffect, useState } from "react";
import { Plus, FolderPlus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import AddAssetFlow from "@/components/others/AddAssetFlow";
import AssetItemModal from "@/components/others/AssetItemModal";
import { otherAssets as seedAssets } from "@/lib/mock/others";
import { OtherAsset } from "@/lib/types";
import { ParsedAsset } from "@/lib/ai/parseAsset";
import { formatPKR } from "@/lib/format";

const STORAGE_KEY = "lime-others-assets";

function loadItems(): OtherAsset[] {
  if (typeof window === "undefined") return seedAssets;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedAssets;
    return JSON.parse(raw);
  } catch {
    return seedAssets;
  }
}

export default function OthersPage() {
  const [items, setItems] = useState<OtherAsset[]>(seedAssets);
  const [hydrated, setHydrated] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [activeItem, setActiveItem] = useState<OtherAsset | null>(null);

  useEffect(() => {
    // Sync with localStorage (an external system) on mount, after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore storage errors in prototype
    }
  }, [items, hydrated]);

  function handleAdd(parsed: ParsedAsset) {
    const newItem: OtherAsset = { id: `other-${Date.now()}`, ...parsed };
    setItems((prev) => [newItem, ...prev]);
    setShowAdd(false);
  }

  function handleSave(updated: OtherAsset) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setActiveItem(null);
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setActiveItem(null);
  }

  const total = items.reduce((s, i) => s + i.currentValue, 0);

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow="Assets"
        title={formatPKR(total)}
        subtitle="Fixed deposits, savings certificates, and anything else you've added manually."
        right={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-yellow hover:opacity-90"
          >
            <Plus size={16} /> Add asset
          </button>
        }
      />

      <div className="mx-4 sm:mx-8">
        {items.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
              <FolderPlus size={28} className="text-muted" />
              <p className="text-sm font-semibold text-ink">Nothing added yet</p>
              <p className="text-sm text-muted max-w-sm">
                Add fixed deposits, national savings certificates, provident funds, or anything else Lime doesn&apos;t track automatically.
              </p>
              <button onClick={() => setShowAdd(true)} className="mt-1 rounded-full bg-yellow px-4 py-2 text-sm font-semibold text-ink hover:bg-yellow-dark">
                + Add your first asset
              </button>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="!px-0">
              <div className="divide-y divide-border/70">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-cream/60"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-ink">{item.name}</span>
                      <span className="block text-xs text-muted">{item.type}</span>
                    </span>
                    <span className="font-heading text-lg text-ink">{formatPKR(item.currentValue)}</span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        <button
          onClick={() => setShowAdd(true)}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border py-4 text-sm font-semibold text-muted hover:border-ink/30 hover:text-ink"
        >
          <Plus size={16} /> Add asset
        </button>
      </div>

      {showAdd && <AddAssetFlow onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {activeItem && <AssetItemModal item={activeItem} onClose={() => setActiveItem(null)} onSave={handleSave} onDelete={handleDelete} />}
    </div>
  );
}
