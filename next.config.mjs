/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["snoowrap"],
  },
};

export default nextConfig;
