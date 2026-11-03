/** @type {import('next').NextConfig} */
const nextConfig = {
  // The browser tests build into their own folder (pointed at a throwaway
  // backend), so they never overwrite the normal build in .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Lets a second browser session on 127.0.0.1 use the dev server (HMR and
  // hydration are blocked for other origins otherwise).
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
      {
        // The Zoom Meeting SDK needs cross-origin isolation (SharedArrayBuffer)
        // for video decoding. `credentialless` rather than `require-corp`: with
        // `require-corp`, Zoom's CDN and worker assets without a CORP header are
        // blocked and the meeting shows a black screen. Scoped to the meeting
        // page so the rest of the portal can embed cross-origin images freely.
        source: "/meeting/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
