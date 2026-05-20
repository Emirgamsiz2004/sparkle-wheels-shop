import { TestDrive } from "@/hooks/useTestDrives";
import { useProefritTimer } from "@/hooks/useProefritTimer";
import { Clock } from "lucide-react";

interface Props {
  testDrive: TestDrive;
  size?: "lg" | "sm";
  className?: string;
}

const toneStyles = {
  green: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  amber: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  red: "text-red-400 border-red-500/30 bg-red-500/10",
  expired: "text-red-300 border-red-500/50 bg-red-500/20 animate-pulse",
};

/** Big countdown shown on proefrit detail / popover. */
const ProefritCountdown = ({ testDrive, size = "lg", className = "" }: Props) => {
  const { active, mmss, tone, expired } = useProefritTimer(testDrive);
  if (!active) return null;

  const isLg = size === "lg";
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border font-mono tabular-nums ${toneStyles[tone]} ${
        isLg ? "px-4 py-2 text-2xl" : "px-2 py-0.5 text-xs"
      } ${className}`}
      title={expired ? "Proefrit overschreden" : "Resterende tijd"}
    >
      <Clock className={isLg ? "w-5 h-5" : "w-3 h-3"} />
      <span>{mmss}</span>
      {isLg && expired && (
        <span className="ml-2 text-xs font-sans uppercase tracking-wider">Overschreden</span>
      )}
    </div>
  );
};

export default ProefritCountdown;
