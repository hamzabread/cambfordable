"use client";

import { GraduationCap, WifiOff } from "lucide-react";
import { usePortalAccountError } from "./usePortalUser";

export default function PortalLoading({ label = "Loading your portal..." }) {
  const { error, retry } = usePortalAccountError();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fd] px-4">
        <div role="alert" className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <WifiOff className="h-6 w-6" />
          </div>
          <h1 className="text-base font-bold text-slate-800">Can&apos;t load the portal</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-5 rounded-lg bg-[#0866ef] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fd] px-4">
      <div className="text-center" role="status">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0866ef] text-white shadow-lg shadow-blue-200">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div className="mx-auto mb-3 h-1.5 w-32 overflow-hidden rounded-full bg-blue-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[#0866ef]" />
        </div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}
