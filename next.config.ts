import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // Re-habilitado para garantir integridade do build em produção
    ignoreBuildErrors: false,
  },
  eslint: {
    // Ignoramos lint no build para evitar bloqueio por 'any' ou avisos menores, mas mantemos o TS rigoroso
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Reduz as threads de compilação pra 1, evitando estourar a RAM (OOM) no Coolify
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
