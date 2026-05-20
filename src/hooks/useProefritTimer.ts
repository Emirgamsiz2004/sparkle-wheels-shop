import { useEffect, useState } from "react";
import { TestDrive } from "@/hooks/useTestDrives";

const MAX_MIN_DEFAULT = 30;

export function getProefritDeadline(td: TestDrive): number | null {
  if (td.status !== "actief") return null;
  const startStr = (td as any).vertrek_tijd || td.formulier_ingevuld_op || td.start_tijd;
  if (!startStr) return null;
  const start = new Date(startStr).getTime();
  const max = (td as any).max_duur_minuten || MAX_MIN_DEFAULT;
  return start + max * 60_000;
}

/**
 * Returns countdown info for an active proefrit.
 * - remainingMs: ms left until deadline (can be negative when overdue)
 * - mmss: formatted string MM:SS (zero-padded). When overdue, prefixed with "-".
 * - tone: "green" | "amber" | "red" | "expired"
 */
export function useProefritTimer(td: TestDrive | null | undefined) {
  const deadline = td ? getProefritDeadline(td) : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline) return { active: false, remainingMs: 0, mmss: "", tone: "green" as const, expired: false };

  const remainingMs = deadline - now;
  const expired = remainingMs <= 0;
  const totalSec = Math.max(0, Math.floor(Math.abs(remainingMs) / 1000));
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const mmss = (expired ? "-" : "") + `${mm}:${ss}`;

  let tone: "green" | "amber" | "red" | "expired" = "green";
  if (expired) tone = "expired";
  else if (remainingMs <= 5 * 60_000) tone = "red";
  else if (remainingMs <= 10 * 60_000) tone = "amber";

  return { active: true, remainingMs, mmss, tone, expired };
}

/** Pick the most relevant active testdrive for sidebar badge: nearest to expiring. */
export function pickPrimaryActive(tds: TestDrive[]): TestDrive | null {
  const active = tds.filter((t) => t.status === "actief");
  if (!active.length) return null;
  return active
    .map((t) => ({ t, d: getProefritDeadline(t) ?? Infinity }))
    .sort((a, b) => a.d - b.d)[0].t;
}
