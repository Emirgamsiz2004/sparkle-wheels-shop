import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  value: string;
}

interface SlidingTabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SlidingTabs = ({ tabs, value, onChange, className }: SlidingTabsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    if (!containerRef.current) return;
    const activeBtn = containerRef.current.querySelector(`[data-value="${value}"]`) as HTMLElement;
    if (activeBtn) {
      setIndicator({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [value]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  return (
    <div
      ref={containerRef}
      className={cn("relative flex gap-0.5 bg-secondary/50 border border-border rounded-md p-0.5", className)}
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-0.5 bottom-0.5 bg-accent rounded transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {tabs.map((t) => (
        <button
          key={t.value}
          data-value={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "relative z-10 px-3 py-1.5 text-xs font-medium rounded transition-colors duration-200 whitespace-nowrap",
            value === t.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default SlidingTabs;
