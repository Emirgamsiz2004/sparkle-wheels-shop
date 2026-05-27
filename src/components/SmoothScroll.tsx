import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";

const SmoothScroll = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Admin gebruikt eigen scroll-containers; smooth scroll alleen op publieke site
    if (pathname.startsWith("/admin")) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
};

export default SmoothScroll;
