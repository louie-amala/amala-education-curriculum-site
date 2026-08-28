/** @type {import('next').NextConfig} */
const nextConfig = {
  // content-source YAML is read at build time via fs; nothing special needed yet.

  // Cloud Run: emit a self-contained server bundle (.next/standalone) so the deployed
  // image carries only the traced runtime files rather than the whole node_modules tree.
  output: "standalone",
};

export default nextConfig;
