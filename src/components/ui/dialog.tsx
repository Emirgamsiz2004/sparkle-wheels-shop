import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { keepFocusedFieldVisible, useKeyboardSafeViewport } from "@/hooks/use-keyboard-safe-viewport";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Subtieler dan voorheen: rgba(0,0,0,0.4) i.p.v. zwart 80%, en 0.5 op mobiel via media query class
      "fixed inset-0 z-50 bg-[rgba(0,0,0,0.4)] md:bg-[rgba(0,0,0,0.4)] [data-mobile=true]:bg-[rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:duration-150",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/* ---------- Mobile detection (no flicker, lazy) ---------- */
function useIsMobileViewport() {
  const [m, setM] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setM(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return m;
}

/* ---------- Swipe-to-close hook for bottom sheet ---------- */
function useSwipeToClose(enabled: boolean, onClose: () => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  const startY = React.useRef<number | null>(null);
  const dragging = React.useRef(false);
  const lastY = React.useRef(0);

  React.useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      // Only start drag from top area / handle (first 60px) to avoid hijacking scroll
      const target = e.target as HTMLElement;
      const sheetRect = el.getBoundingClientRect();
      const touchY = e.touches[0].clientY;
      const fromHandleZone = touchY - sheetRect.top < 60;
      // Or when the inner scroll is at top
      const scroller = el.querySelector<HTMLElement>("[data-sheet-scroll]");
      const atTop = !scroller || scroller.scrollTop <= 0;
      if (!fromHandleZone && !atTop) return;
      startY.current = touchY;
      dragging.current = true;
      el.style.transition = "none";
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        lastY.current = dy;
        el.style.transform = `translateY(${dy}px)`;
      }
    };
    const onTouchEnd = () => {
      if (!dragging.current) return;
      dragging.current = false;
      el.style.transition = "transform 280ms cubic-bezier(0.32,0.72,0,1)";
      if (lastY.current > 80) {
        el.style.transform = "translateY(100%)";
        setTimeout(() => onClose(), 260);
      } else {
        el.style.transform = "translateY(0)";
      }
      startY.current = null;
      lastY.current = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, onClose]);

  return ref;
}

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Hide the built-in close (X) button — set this if you render your own. */
  hideClose?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideClose, style, ...props }, ref) => {
  const isMobile = useIsMobileViewport();
  const keyboardViewport = useKeyboardSafeViewport(isMobile);
  const swipeRef = useSwipeToClose(isMobile, () => {
    // Trigger Radix close by dispatching Escape
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  });

  // Merge refs
  const setRefs = (node: HTMLDivElement | null) => {
    swipeRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  if (isMobile) {
    const mobileBottom = Math.max(keyboardViewport.bottomInset, keyboardViewport.focusedInset);
    const mobileMaxHeight = keyboardViewport.isInputFocused
      ? `min(68vh, calc(${keyboardViewport.height}px - 18px))`
      : `min(85vh, calc(${keyboardViewport.height}px - 16px))`;

    return (
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          ref={setRefs}
          className={cn(
            "fixed left-0 right-0 bottom-0 z-50 flex flex-col",
            "bg-[hsl(0_0%_8%)] text-foreground",
            "border-t border-x border-white/[0.08]",
            "shadow-[0_-8px_32px_rgba(0,0,0,0.5)]",
            "max-h-[85vh] overflow-hidden",
            "data-[state=open]:animate-sheet-up data-[state=closed]:animate-sheet-down",
            // remove any custom max-w / centering passed by callers — those are desktop concerns
            className?.replace(/max-w-\S+|w-\S+|sm:rounded-\S+|rounded-\S+/g, ""),
          )}
          style={{
            borderRadius: "20px 20px 0 0",
            willChange: "transform",
            bottom: mobileBottom,
            maxHeight: mobileMaxHeight,
            transition: "bottom 220ms ease-out, transform 280ms cubic-bezier(0.32,0.72,0,1)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
            ...style,
          }}
          onAnimationEnd={(e) => {
            // strip will-change after animation to free GPU
            (e.currentTarget as HTMLElement).style.willChange = "auto";
          }}
          {...props}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-3 shrink-0 cursor-grab active:cursor-grabbing">
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
          </div>
          <div
            data-sheet-scroll
            onFocusCapture={(e) => keepFocusedFieldVisible(e.target)}
            className="overflow-y-auto overscroll-contain px-5 pb-2 -mx-px"
          >
            {children}
          </div>
          {!hideClose && (
            <DialogPrimitive.Close
              className="absolute right-3 top-3 z-10 h-8 w-8 inline-flex items-center justify-center rounded-[10px] text-white/60 hover:text-white hover:bg-white/[0.06] transition"
              aria-label="Sluiten"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }

  // ===== DESKTOP =====
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={setRefs}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4",
          "bg-[hsl(0_0%_8%)] text-foreground",
          "border border-white/[0.08]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
          "p-5",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97]",
          "data-[state=open]:duration-200 data-[state=closed]:duration-150",
          "ease-out",
          className,
        )}
        style={{ borderRadius: 16, willChange: "transform" }}
        onAnimationEnd={(e) => {
          (e.currentTarget as HTMLElement).style.willChange = "auto";
        }}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            className="absolute right-3 top-3 h-8 w-8 inline-flex items-center justify-center rounded-[10px] text-white/60 hover:text-white hover:bg-white/[0.06] transition disabled:pointer-events-none"
            aria-label="Sluiten"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-base font-bold leading-tight tracking-tight text-white", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
