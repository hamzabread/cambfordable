"use client";

import { useEffect } from "react";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearTokens, getRefreshToken, redirectToLogin, saveTokens } from "@/lib/auth";
import { API_URL } from "@/lib/portal";

const PORTAL_PATHS = /^\/(dashboard|courses|homework|homework-submissions|quiz|quizzes|quiz-submissions|results|messages|schedule|profile|ta|meeting)(\/|$)/;

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
    saveTokens(response.data);
    return response.data.access_token as string;
  } catch {
    clearTokens();
    return null;
  }
}

let installed = false;

function installInterceptor() {
  if (installed) return;
  installed = true;
  axios.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const url = config?.url || "";
    const isAuthCall = /\/auth\/(login|refresh|signup|forgot-password|reset-password)/.test(url);
    const sentToken = Boolean(config?.headers?.Authorization);
    if (
      error.response?.status !== 401 ||
      !config ||
      config._retried ||
      isAuthCall ||
      !sentToken
    ) {
      return Promise.reject(error);
    }

    // One refresh at a time; parallel requests wait for the same one.
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });
    const token = await refreshing;
    if (!token) {
      if (PORTAL_PATHS.test(window.location.pathname)) redirectToLogin("expired");
      return Promise.reject(error);
    }
    config._retried = true;
    config.headers.Authorization = `Bearer ${token}`;
    return axios(config);
  });
}

// Installed on load, before any page's first request.
if (typeof window !== "undefined") installInterceptor();

/** Keeps the session alive (token refresh) and stops the Back button from
 *  showing a portal page after signing out. */
export default function AuthSession() {
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (
        event.persisted &&
        PORTAL_PATHS.test(window.location.pathname) &&
        !localStorage.getItem("access_token")
      ) {
        window.location.replace("/login");
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return null;
}
