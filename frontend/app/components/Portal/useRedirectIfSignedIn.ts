"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { safeNextPath } from "@/lib/auth";
import { API_URL, authHeaders, getAccessToken } from "@/lib/portal";

/** Login and signup forms are pointless to someone already signed in. */
export function useRedirectIfSignedIn(next?: string | null) {
  const router = useRouter();
  const [checking, setChecking] = useState(() => Boolean(getAccessToken()));

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    let cancelled = false;
    axios
      .get(`${API_URL}/auth/me`, { headers: authHeaders(token) })
      .then(() => {
        if (!cancelled) router.replace(safeNextPath(next));
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router, next]);

  return checking;
}
