"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { getApiError } from "@/lib/portal";

interface ConfirmDeleteProps {
  /** Names the thing, for the button's accessible label: "Quiz 3". */
  itemName: string;
  /** What goes with it, shown before the admin confirms. */
  warning: string;
  onConfirm: () => Promise<void>;
}

/** A trash button that asks once, inline, before deleting. */
export default function ConfirmDelete({ itemName, warning, onConfirm }: ConfirmDeleteProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (requestError) {
      setError(getApiError(requestError, "It wasn't deleted. Try again."));
      setDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${itemName}`}
        title="Delete"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div role="alertdialog" aria-label={`Delete ${itemName}?`} className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-left">
      <p className="text-xs leading-5 text-red-800">
        <strong className="font-semibold text-red-900">Delete {itemName}?</strong> {warning}
      </p>
      {error && <p className="mt-1.5 text-xs font-semibold text-red-700">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={remove} disabled={deleting} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700 disabled:bg-red-300">
          {deleting && <Loader2 className="h-3 w-3 animate-spin" />} Delete
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="h-8 rounded-md px-3 text-xs font-bold text-slate-600 hover:bg-white">
          Keep
        </button>
      </div>
    </div>
  );
}
