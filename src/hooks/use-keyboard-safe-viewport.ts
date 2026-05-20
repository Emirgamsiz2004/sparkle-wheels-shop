import { useLayoutEffect, useState } from "react";

type KeyboardSafeViewport = {
  bottomInset: number;
  focusedInset: number;
  height: number;
  isInputFocused: boolean;
};

export function useKeyboardSafeViewport(enabled = true): KeyboardSafeViewport {
  const [viewport, setViewport] = useState<KeyboardSafeViewport>(() => ({
    bottomInset: 0,
    focusedInset: 0,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
    isInputFocused: false,
  }));

  useLayoutEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const update = () => {
      const visualViewport = window.visualViewport;
      const active = document.activeElement;
      const isInputFocused = !!active?.matches?.("input, textarea, select, [contenteditable='true']");

      if (!visualViewport) {
        setViewport({ bottomInset: 0, focusedInset: isInputFocused ? 260 : 0, height: window.innerHeight, isInputFocused });
        return;
      }

      const detectedInset = Math.max(
        0,
        window.innerHeight - visualViewport.height - visualViewport.offsetTop
      );

      setViewport({
        bottomInset: detectedInset,
        focusedInset: isInputFocused ? Math.max(detectedInset, 260) : 0,
        height: visualViewport.height,
        isInputFocused,
      });
    };

    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
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