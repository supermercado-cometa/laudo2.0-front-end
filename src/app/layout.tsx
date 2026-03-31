import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppVersionGuard from "@/components/app-version-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#4288a8]`}
      >
        {/* Guarda de versão para limpar cache/cookies ao atualizar o app */}
        <AppVersionGuard />
        {children}
      </body>
    </html>
  );
}
