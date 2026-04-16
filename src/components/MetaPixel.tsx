import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

const MetaPixel = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const [pixelId, setPixelId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const hasConsent = useCallback(() => {
    return localStorage.getItem("cookie_consent") === "accepted";
  }, []);

  // Fetch pixel ID once
  useEffect(() => {
    if (isAdmin) return;
    if (!hasConsent()) return;

    supabase.functions.invoke("get-meta-pixel").then(({ data }) => {
      if (data?.pixelId) setPixelId(data.pixelId);
    });
  }, [isAdmin, hasConsent]);

  // Listen for consent changes (cookie banner acceptance)
  useEffect(() => {
    if (isAdmin || pixelId) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cookie_consent" && e.newValue === "accepted") {
        supabase.functions.invoke("get-meta-pixel").then(({ data }) => {
          if (data?.pixelId) setPixelId(data.pixelId);
        });
      }
    };

    // Also poll for same-tab changes (localStorage events only fire cross-tab)
    const interval = setInterval(() => {
      if (hasConsent() && !pixelId) {
        supabase.functions.invoke("get-meta-pixel").then(({ data }) => {
          if (data?.pixelId) {
            setPixelId(data.pixelId);
            clearInterval(interval);
          }
        });
      }
    }, 2000);

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [isAdmin, pixelId, hasConsent]);

  // Init pixel when ID is available
  useEffect(() => {
    if (!pixelId || initialized) return;

    (function (f: any, b: any, e: any, v: string, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
    setInitialized(true);
  }, [pixelId, initialized]);

  // Track page views on route changes
  useEffect(() => {
    if (!initialized || !window.fbq) return;
    window.fbq("track", "PageView");
  }, [location.pathname, initialized]);

  if (isAdmin || !pixelId) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
};

export default MetaPixel;
