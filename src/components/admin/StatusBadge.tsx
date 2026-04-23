import { cn } from "@/lib/utils";

/**
 * Consistent status badge styling used across all admin tables.
 * Fixed min-width, centered text, same height/padding/font-size everywhere.
 */
export const BADGE_BASE =
  "inline-flex items-center justify-center min-w-[100px] h-6 px-2 rounded text-[11px] font-medium border whitespace-nowrap leading-none text-center";

interface StatusBadgeProps {
  className?: string;
  children: React.ReactNode;
}

export function StatusBadge({ className, children }: StatusBadgeProps) {
  return <span className={cn(BADGE_BASE, className)}>{children}</span>;
}

