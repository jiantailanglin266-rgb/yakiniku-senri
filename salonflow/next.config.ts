import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 * See docs/security/SECURITY.md for the rationale behind each directive.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js injects inline bootstrap scripts; styles come from Tailwind's inline <style>.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client"],
  typedRoutes: false,

  /**
   * Emit `.next/standalone` so the app can be deployed without installing
   * `node_modules` on the target — which is what makes the container image
   * small enough to be practical.
   *
   * Vercel builds to its own output format and does not want this, so it is
   * switched off there rather than left to be ignored.
   */
  output: process.env.VERCEL ? undefined : "standalone",

  /**
   * SalonFlow lives inside a repository whose root holds an unrelated app.
   * Next.js sees two lockfiles and, left alone, picks the repository root as
   * the file-tracing root — which would drag the other app's dependencies
   * into the deployment bundle. Pinning it here keeps tracing inside
   * `salonflow/`.
   */
  outputFileTracingRoot: import.meta.dirname,

  /**
   * Documentation and tests are not needed to serve a request. Turbopack's
   * tracer is conservative and pulls them in via the config file; excluding
   * them keeps the deployment bundle to what actually runs.
   */
  outputFileTracingExcludes: {
    "/**/*": ["docs/**", "tests/**", "**/*.md", ".mailbox/**", "storage/**"],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
