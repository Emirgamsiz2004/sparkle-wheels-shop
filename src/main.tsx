import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Globale "scrolling" detectie — scrollbar toont alleen tijdens actief scrollen
const SCROLL_TIMEOUT = 1000;
const timers = new WeakMap<EventTarget, number>();
const handleScroll = (e: Event) => {
  const el = e.target as Element | Document;
  const target = el === document ? document.documentElement : (el as Element);
  if (!target || !(target as Element).classList) return;
  (target as Element).classList.add("is-scrolling");
  const prev = timers.get(target);
  if (prev) window.clearTimeout(prev);
  const id = window.setTimeout(() => {
    (target as Element).classList.remove("is-scrolling");
    timers.delete(target);
  }, SCROLL_TIMEOUT);
  timers.set(target, id);
};
window.addEventListener("scroll", handleScroll, { capture: true, passive: true });

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
