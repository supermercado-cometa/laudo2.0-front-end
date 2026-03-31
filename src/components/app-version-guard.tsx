"use client";

import React from "react";
import { clearBrowserCachesAndCookies } from "@/lib/browser-cleanup";

export default function AppVersionGuard() {
  const [showNotice, setShowNotice] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
    const storedVersion = localStorage.getItem("APP_VERSION") || "";

    if (storedVersion !== currentVersion) {
      clearBrowserCachesAndCookies();
      localStorage.setItem("APP_VERSION", currentVersion);
      setShowNotice(true);
      // Oculta automaticamente após alguns segundos
      const t = setTimeout(() => setShowNotice(false), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!showNotice) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="rounded-md bg-green-600 text-white px-4 py-2 shadow">
        Aplicação atualizada - cache limpo
      </div>
    </div>
  );
}