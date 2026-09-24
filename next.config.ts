import type { NextConfig } from "next";
import path from "path";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/",
  },
});

const framerShim = path.resolve(__dirname, "src/vendor/framer-shim.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Vendored Framer marketplace JS (THREE / USD parsers) ships as plain ESM.
  turbopack: {
    resolveAlias: {
      framer: framerShim,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      framer: framerShim,
    };
    return config;
  },
};

export default withPWA(nextConfig);
