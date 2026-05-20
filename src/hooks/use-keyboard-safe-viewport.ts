import { useLayoutEffect, useState } from "react";

type KeyboardSafeViewport = {
  bottomInset: number;
  height: number;
};

export function useKeyboardSafeViewport(enabled = true): KeyboardSafeViewport {
  const [viewport, setViewport] = useState<KeyboardSafeViewport>(() => ({
    bottomInset: 0,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  }));

  useLayoutEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const update = () => {
      const visualViewport = window.visualViewport;

      if (!visualViewport) {
        setViewport({ bottomInset: 0, height: window.innerHeight });
        return;
      }

      setViewport({
        bottomInset: Math.max(
          0,
          window.innerHeight - visualViewport.height - visualViewport.offsetTop
        ),
        height: visualViewport.height,
      });
    };

    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [enabled]);

  return viewport;
}

export function keepFocusedFieldVisible(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return;
  if (!target.matches("input, textarea, select, [contenteditable='true']")) return;

  window.setTimeout(() => {
    target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }, 120);
}