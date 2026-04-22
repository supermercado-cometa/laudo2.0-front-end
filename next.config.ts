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
  experimental: {
    // Reduz as threads de compilação pra 1, evitando estourar a RAM (OOM) no Coolify
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
