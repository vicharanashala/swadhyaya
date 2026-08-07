import type { NextConfig } from "next";

// Proctoring needs the camera, the mic, wasm compilation and module
// workers. All four are denied by the baseline policy below, so the
// relaxations are gated on the same env var that gates the feature —
// a deployment with NEXT_PUBLIC_PROCTORING unset keeps the tight
// headers it has today.
//
// Note there is no CDN exception: the TF.js face-detection weights,
// YAMNet and the MediaPipe wasm are all vendored into public/models by
// scripts/setup-proctor-models.mjs, so connect-src stays at 'self'.
const PROCTORING = process.env.NEXT_PUBLIC_PROCTORING === "1";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // camera=() / microphone=() is an EMPTY allowlist — it denies every
    // origin including this one, so getUserMedia is rejected outright.
    // Proctoring needs (self) here or the webcam layer cannot run.
    key: "Permissions-Policy",
    value: PROCTORING
      ? "camera=(self), microphone=(self), geolocation=(), interest-cohort=()"
      : "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
];

const cspDirectives = [
  "default-src 'self'",
  // 'wasm-unsafe-eval' lets the TF.js wasm backend compile its module;
  // blob: lets the detector Workers boot from a bundled blob URL.
  PROCTORING
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  PROCTORING
    ? "connect-src 'self' blob: data:"
    : "connect-src 'self'",
  ...(PROCTORING
    ? ["worker-src 'self' blob:", "media-src 'self' blob:"]
    : []),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspDirectives },
          ...securityHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;