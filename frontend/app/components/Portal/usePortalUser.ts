"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import axios from "axios";
import { redirectToLogin } from "@/lib/auth";
import {
  API_URL,
  authHeaders,
  getAccessToken,
  isUnauthorized,
  PortalUser,
} from "@/lib/portal";

const RETRY_MS = 5000;

// The account-loading error is shared with PortalLoading, which every page
// shows until the user is known, so it can say what went wrong.
let accountError: string | null = null;
let retryNow: (() => void) | null = null;
const listeners = new Set<() => void>();

function setAccountError(message: string | null, retry: (() => void) | null) {
  accountError = message;
  retryNow = retry;
  listeners.forEach((listener) => listener());
}

export function usePortalAccountError() {
  const error = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => accountError,
    () => null,
  );
  return { error, retry: () => retryNow?.() };
}

export function usePortalUser() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshUser = useCallback(async (): Promise<PortalUser | null> => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    const token = getAccessToken();
    if (!token) {
      redirectToLogin();
      return null;
    }

    try {
      const response = await axios.get<PortalUser>(`${API_URL}/auth/me`, {
        headers: authHeaders(token),
      });
      setUser(response.data);
      setError(null);
      setAccountError(null, null);
      return response.data;
    } catch (requestError) {
      if (isUnauthorized(requestError)) {
        redirectToLogin("expired");
      } else {
        const message = axios.isAxiosError(requestError) && !requestError.response
          ? "We can't reach the server. Check your connection; we'll keep trying."
          : "We could not load your account. We'll keep trying.";
        setError(message);
        setAccountError(message, () => void refreshUser());
        // Recover on its own once the server is back.
        retryTimer.current = setTimeout(() => void refreshUser(), RETRY_MS);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      setAccountError(null, null);
    };
  }, [refreshUser]);

  return { user, setUser, loading, error, refreshUser };
}
