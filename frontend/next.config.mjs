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
          // Required for Zoom WebAssembly (SharedArrayBuffer).
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
