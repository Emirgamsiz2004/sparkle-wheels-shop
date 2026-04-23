import { cn } from "@/lib/utils";

/**
 * Consistent status badge styling used across all admin tables.
 * Same height, padding, radius and font size everywhere.
 */
export const BADGE_BASE =
  "inline-flex items-center justify-center h-5 px-2 rounded text-[10px] font-medium border whitespace-nowrap leading-none";

interface StatusBadgeProps {
  className?: string;
  children: React.ReactNode;
}

export function StatusBadge({ className, children }: StatusBadgeProps) {
  return <span className={cn(BADGE_BASE, className)}>{children}</span>;
}
