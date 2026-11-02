"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  downloadProtectedFile,
  fetchProtectedFile,
  getFileError,
  viewProtectedFile,
} from "@/lib/portal";

interface ProtectedFileLinkProps {
  fileUrl: string;
  mode?: "view" | "download";
  filename?: string;
  className?: string;
  children: ReactNode;
}

/** Uploaded files need the login token, which a plain link can't send. */
export function ProtectedFileLink({
  fileUrl,
  mode = "view",
  filename,
  className,
  children,
}: ProtectedFileLinkProps) {
  const [busy, setBusy] = useState(false);

  const openFile = async () => {
    setBusy(true);
    try {
      if (mode === "view") await viewProtectedFile(fileUrl, filename);
      else await downloadProtectedFile(fileUrl, filename);
    } catch (error) {
      window.alert(getFileError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={openFile} disabled={busy} className={className}>
      {children}
    </button>
  );
}

interface ProtectedImageProps {
  fileUrl: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function ProtectedImage({ fileUrl, alt, className, onClick }: ProtectedImageProps) {
  const [loaded, setLoaded] = useState<{ fileUrl: string; src: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    fetchProtectedFile(fileUrl, "view")
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ fileUrl, src: objectUrl });
      })
      .catch(() => {
        if (active) setLoaded({ fileUrl, src: null });
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl]);

  if (loaded?.fileUrl !== fileUrl) return <div className="h-40 w-full animate-pulse rounded bg-slate-100" />;
  const src = loaded.src;
  if (!src) return <p className="text-sm text-red-600">This image could not be loaded.</p>;
  return <img src={src} alt={alt} className={className} onClick={onClick} />;
}
