"use client";

import { useCallback, useEffect, useState } from "react";

type PushState = "unsupported" | "default" | "granted" | "denied" | "loading";

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading");

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setState("unsupported");
      return;
    }
    setState(Notification.permission as PushState);
  }, []);

  const subscribe = useCallback(async () => {
    if (state === "unsupported") return { success: false, error: "Não suportado" };

    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return { success: false, error: "Permissão negada" };
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
        ) as unknown as ArrayBuffer,
      });

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      if (response.ok) {
        setState("granted");
        return { success: true };
      }
      setState("default");
      return { success: false, error: "Erro ao salvar subscription" };
    } catch (err) {
      setState("default");
      return { success: false, error: String(err) };
    }
  }, [state]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      await sub?.unsubscribe();

      await fetch("/api/notifications/subscribe", { method: "DELETE" });
      setState("default");
    } catch (err) {
      console.error("unsubscribe:", err);
    }
  }, []);

  return { state, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
