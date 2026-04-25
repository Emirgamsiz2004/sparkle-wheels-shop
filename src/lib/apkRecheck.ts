import { supabase } from "@/integrations/supabase/client";

/**
 * Haalt actuele APK-vervaldatum op via RDW.
 * Returnt 'YYYY-MM-DD' of null bij fout/geen data.
 */
export async function fetchApkFromRdw(kenteken: string): Promise<string | null> {
  const clean = kenteken.replace(/[-\s]/g, "").toUpperCase();
  if (clean.length < 5) return null;
  try {
    const res = await fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${clean}`);
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.[0]?.vervaldatum_apk;
    if (!raw || raw.length < 8) return null;
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  } catch {
    return null;
  }
}

/**
 * Vergelijkt RDW-APK met opgeslagen datum en update indien verschillend.
 * Returnt de nieuwe datum als er een update plaatsvond, anders null.
 */
export async function recheckApk(
  vehicleId: string,
  kenteken: string | undefined | null,
  currentApk: string | undefined | null
): Promise<string | null> {
  if (!kenteken) return null;
  const fresh = await fetchApkFromRdw(kenteken);
  if (!fresh) return null;
  const current = currentApk ? currentApk.slice(0, 10) : null;
  if (fresh === current) return null;
  const { error } = await supabase
    .from("vehicles")
    .update({ apk_vervaldatum: fresh } as any)
    .eq("id", vehicleId);
  if (error) return null;
  return fresh;
}

export function formatApkNl(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}
