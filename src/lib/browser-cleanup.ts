export function clearBrowserCachesAndCookies() {
  try {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("fullName");
        sessionStorage.clear();
      } catch {}

      try {
        if ("caches" in window) {
          caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
        }
      } catch {}

      try {
        const cookies = document.cookie.split("; ");
        for (const c of cookies) {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substring(0, eqPos) : c;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      } catch {}
    }
  } catch {}
}