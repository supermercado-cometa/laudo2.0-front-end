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
  description: "Laudo Tecnico",
  icons: {
    icon: "/user-interface.png",
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
      </body>
    </html>
  );
}
