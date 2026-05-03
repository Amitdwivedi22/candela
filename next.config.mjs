/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [],
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
