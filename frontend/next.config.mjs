/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Zoom WebAssembly (WASM) to work
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
  // If you see issues with the Zoom SDK's internal dependencies, add this:
  transpilePackages: ['@zoom/meetingsdk'],
};

export default nextConfig;