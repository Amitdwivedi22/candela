/** @type {import('next').NextConfig} */
const distDir =
  process.env.NEXT_DIST_DIR ||
  (process.env.NODE_ENV === "development" ? ".next-dev" : ".next");

const nextConfig = {
  distDir,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      "mongoose",
      "mongodb",
      "bson",
      "@mongodb-js/saslprep",
      "@opentelemetry/api",
    ],
  },
  images: {
    remotePatterns: [],
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
