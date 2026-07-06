import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import AppVersionGuard from "@/components/app-version-guard";

const roboto = Roboto({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Laudo Tecnico",
  description: "Sistema de emissão de laudos técnicos - Cometa",
  generator: 'Next.js',
  manifest: '/manifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Laudo Tecnico",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/Logo_apk_pwa.png",
    apple: "/Logo_apk_pwa.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={`${roboto.variable} antialiased`}
      >
        {/* Guarda de versão para limpar cache/cookies ao atualizar o app */}
        <AppVersionGuard />
        {children}
        {/* Registro do Service Worker para PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registrado com sucesso:', registration.scope);
                    },
                    function(err) {
                      console.log('Falha ao registrar o Service Worker:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
