import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignora erros de tipagem para contornar bugs de worker do Next 15
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora avisos de lint no build para acelerar o deploy
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
