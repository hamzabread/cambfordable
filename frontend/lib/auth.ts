const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export function saveTokens(tokens: { access_token: string; refresh_token?: string | null }) {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  if (tokens.refresh_token) localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function getRefreshToken() {
  return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/** Where to go after signing in: only paths on this site, never back to the auth pages. */
export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (/^\/(login|signup|forgot-password|reset-password)\b/.test(value)) return "/dashboard";
  return value;
}

/** Sends the visitor to the login page and brings them back afterwards. */
export function redirectToLogin(reason?: "expired") {
  clearTokens();
  const here = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams();
  if (here !== "/login") params.set("next", here);
  if (reason) params.set("reason", reason);
  const query = params.toString();
  // replace(): the signed-in page must not stay in the back history.
  window.location.replace(`/login${query ? `?${query}` : ""}`);
}

export function logout() {
  clearTokens();
  window.location.replace("/login");
}
