"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
        // Optionally: console.log('Service Worker registered')
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("SW registration failed", err);
      }
    };

    register();
  }, []);

  return null;
}
