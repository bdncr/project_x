import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  /**
   * Next blocks cross-origin requests to dev-only assets by default, so opening the dev
   * server on one of this machine's LAN addresses (the "Network:" URL it prints, or a
   * phone on the same Wi-Fi) 403s every /_next/static chunk. The page then never
   * hydrates, the data-fetching effects never run, and every grid sits on its grey
   * skeleton forever — which looks exactly like a broken backend. Hostnames only here:
   * no scheme, no port. Production builds are unaffected.
   */
  allowedDevOrigins: ["192.168.56.1", "192.168.1.10", "192.168.0.76", "192.168.*.*"],
};

export default nextConfig;
