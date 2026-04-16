import { useEffect, useState } from "react";
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

  // Fetch pixel ID once
  useEffect(() => {
    if (isAdmin) return;
    const consent = localStorage.getItem("cookie_consent");
    if (consent !== "accepted") return;

    supabase.functions.invoke("get-meta-pixel").then(({ data }) => {
      if (data?.pixelId) setPixelId(data.pixelId);
    });
  }, [isAdmin]);

  // Init pixel when ID is available
  useEffect(() => {
    if (!pixelId || window.fbq) return;

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
  }, [pixelId]);

  // Track page views on route changes
  useEffect(() => {
    if (!window.fbq) return;
    window.fbq("track", "PageView");
  }, [location.pathname]);

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
