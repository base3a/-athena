import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove the X-Powered-By response header (security best practice)
  poweredByHeader: false,

  // Strict mode catches potential issues during development
  reactStrictMode: true,

  // Turbopack config (default in Next.js 16).
  // Empty object silences the "webpack config present but no turbopack config"
  // error while keeping all other settings intact.
  turbopack: {},

  experimental: {
    // Use the standard .next/ output path instead of .next/dev/
    // This prevents cold-start ENOENT failures when .next is wiped
    isolatedDevBuild: false,
  },

  // Custom security and performance response headers applied to every route
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Block clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Force HTTPS for 1 year (Vercel always serves HTTPS)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Disable browser DNS prefetch for privacy
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // In production, Next.js content-hashes all static filenames so immutable
      // caching is safe. In dev, filenames repeat across HMR rebuilds so we
      // must not cache them — otherwise the browser serves stale bundles.
      ...(process.env.NODE_ENV === "production"
        ? [{
            source: "/_next/static/(.*)",
            headers: [
              { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
            ],
          }]
        : []),
    ];
  },
};

export default nextConfig;
