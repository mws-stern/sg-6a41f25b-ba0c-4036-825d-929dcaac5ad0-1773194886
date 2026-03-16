/** @type {import('next').NextConfig} */
import { createRequire } from "module";
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  eslint: { ignoreDuringBuilds: true }
};
export default nextConfig;