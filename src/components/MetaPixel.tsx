import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

const MetaPixel = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin || !META_PIXEL_ID) return;

    const consent = localStorage.getItem("cookie_consent");
    if (consent !== "accepted") return;

    // Prevent double-init
    if (window.fbq) return;

    // Meta Pixel base code
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

    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }, [isAdmin]);

  // Track page views on route changes
  useEffect(() => {
    if (isAdmin || !META_PIXEL_ID) return;
    if (!window.fbq) return;

    window.fbq("track", "PageView");
  }, [location.pathname, isAdmin]);

  if (isAdmin || !META_PIXEL_ID) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
};

export default MetaPixel;
