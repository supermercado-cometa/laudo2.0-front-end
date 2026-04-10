import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  distDir: "build",
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "http://localhost:4000/:path*",
      },
    ];
  },
};

export default nextConfig;
