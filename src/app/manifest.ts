import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cometa Laudo Técnico',
    short_name: 'Laudo Técnico',
    description: 'Sistema de emissão de laudos técnicos para Supermercados Cometa',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0E3D8A',
    icons: [
      {
        src: '/Logo_apk_pwa.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/Logo_apk_pwa.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/Logo_apk_pwa.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
