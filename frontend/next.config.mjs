/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Zoom Meeting SDK (Component View) needs cross-origin isolation so it can
  // use SharedArrayBuffer for video decoding.
  //
  // IMPORTANT: use `credentialless` (NOT `require-corp`). With `require-corp`,
  // every cross-origin asset the SDK pulls from Zoom's CDN/workers must send a
  // CORP header or it is blocked — which shows up as a black meeting screen.
  // `credentialless` keeps the page cross-origin isolated while letting those
  // assets load. This regressed when the app moved from a static export (where
  // headers() is ignored) to a real Next 16 server (where it is applied).
  //
  // Scoped to /meeting/* only, so the rest of the site is NOT cross-origin
  // isolated and can keep embedding cross-origin images (payment proofs,
  // homework/quiz images, etc.) without needing CORP headers everywhere.
  async headers() {
    return [
      {
        source: "/meeting/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  // Helps the bundler handle the Zoom SDK's internal dependencies.
  transpilePackages: ["@zoom/meetingsdk"],
};

export default nextConfig;
