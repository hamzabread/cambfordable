"use client";

import { useState } from "react";
import axios from "axios";
import { Loader, Trash2 } from "lucide-react";
import { API_URL, authHeaders, getApiError } from "@/lib/portal";

interface DeleteUserCardProps {
  user: { id: number; username: string; full_name?: string | null; is_admin: boolean };
  onDeleted: (id: number) => void;
}

/** Permanently delete an account, after typing its username. */
export default function DeleteUserCard({ user, onDeleted }: DeleteUserCardProps) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = user.full_name || user.username;

  const remove = async () => {
    setDeleting(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/users/${user.id}`, { headers: authHeaders(), params: { confirm } });
      onDeleted(user.id);
    } catch (requestError) {
      setError(getApiError(requestError, "The account wasn't deleted."));
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-red-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Delete account</p>
          <p className="mt-1 text-xs text-slate-500">
            {user.is_admin
              ? "Admins can't be deleted. Change this person's role to Student first."
              : "Removes the account and everything they submitted: quiz answers, homework, grades, messages, enrollments and payment proofs."}
          </p>
        </div>
        {!user.is_admin && !open && (
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete account
          </button>
        )}
      </div>
      {open && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">Delete {name}&apos;s account permanently?</p>
          <p className="mt-1 text-xs text-red-800">This can&apos;t be undone.</p>
          <label className="mt-3 block text-xs font-semibold text-red-900">
            Type <span className="font-mono">{user.username}</span> to confirm
            <input
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="off"
              className="mt-1 block h-10 w-full max-w-xs rounded-lg border border-red-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </label>
          {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={deleting || confirm.trim().toLowerCase() !== user.username.toLowerCase()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700 disabled:bg-red-300"
            >
              {deleting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete account
            </button>
            <button type="button" onClick={() => { setOpen(false); setConfirm(""); setError(null); }} className="h-9 rounded-lg px-3 text-xs font-bold text-slate-600 hover:bg-white">
              Keep it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
