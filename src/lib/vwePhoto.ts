/**
 * Normaliseert VWE foto-URLs zodat het juiste sjabloon (overlay) wordt getoond.
 *
 * - Verkocht: voeg het "occ_verkocht.png" overlay sjabloon toe.
 * - Anders: verwijder elk sjabloon (templateid + overlay), toon de schone foto.
 *
 * VWE serveert images via query params, bv:
 *   https://media-cdn.vwe.nl/Images/123?templateid=...&overlay=occ_rdw.png&w=1280
 */
export function getVoertuigFotoUrl(
  fotoUrl: string | undefined | null,
  isVerkocht: boolean
): string {
  if (!fotoUrl) return "";
  try {
    const u = new URL(fotoUrl, "https://media-cdn.vwe.nl");
    // Strip eventuele bestaande sjablonen altijd eerst.
    u.searchParams.delete("templateid");
    u.searchParams.delete("overlay");
    if (isVerkocht) {
      u.searchParams.set("overlay", "occ_verkocht.png");
    } else {
      // Laat templateid leeg meegeven (zoals VWE verwacht voor "geen sjabloon"),
      // alleen wanneer er al andere params zijn, zodat we de URL niet onnodig wijzigen.
      u.searchParams.set("templateid", "");
      u.searchParams.set("overlay", "");
    }
    return u.toString();
  } catch {
    return fotoUrl;
  }
}
