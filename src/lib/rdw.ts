import { toast } from "sonner";

export interface RdwVehicleData {
  merk: string;
  model: string;
  kleur: string;
  bouwjaar: number;
  apkTot: string;
  motorinhoud: string;
  brandstof: string;
  carrosserie: string;
  vermogen: number | null;
  aantalDeuren: number | null;
  aantalZitplaatsen: number | null;
  gewicht: number | null;
  catalogusprijs: number | null;
  eersteToelating: string;
  aantalCilinders: number | null;
}

const capitalize = (s: string): string =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

const formatRdwDate = (d: string): string => {
  if (!d || d.length < 8) return "";
  // RDW format: "20260101" → "2026-01-01" (for date inputs)
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
};

export async function fetchRdwData(kenteken: string): Promise<RdwVehicleData | null> {
  const clean = kenteken.replace(/[-\s]/g, "").toUpperCase();
  if (clean.length < 5) return null;

  try {
    const [voertuigRes, brandstofRes] = await Promise.all([
      fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${clean}`),
      fetch(`https://opendata.rdw.nl/resource/8ys7-d773.json?kenteken=${clean}`),
    ]);

    const voertuigData = await voertuigRes.json();
    const brandstofData = await brandstofRes.json();

    if (!voertuigData?.[0]) {
      toast.error("Kenteken niet gevonden in RDW");
      return null;
    }

    const v = voertuigData[0];
    const b = brandstofData?.[0];

    const cilinderinhoud = v.cilinderinhoud
      ? (Number(v.cilinderinhoud) / 1000).toFixed(1)
      : "";

    const vermogenKw = b?.nettomaximumvermogen ? Number(b.nettomaximumvermogen) : null;
    const vermogenPk = vermogenKw ? Math.round(vermogenKw * 1.36) : null;

    const result: RdwVehicleData = {
      merk: capitalize(v.merk || ""),
      model: capitalize(v.handelsbenaming || ""),
      kleur: capitalize(v.eerste_kleur || ""),
      bouwjaar: v.datum_eerste_toelating ? Number(v.datum_eerste_toelating.slice(0, 4)) : 0,
      apkTot: formatRdwDate(v.vervaldatum_apk || ""),
      motorinhoud: cilinderinhoud,
      brandstof: capitalize(b?.brandstof_omschrijving || v.brandstof_omschrijving || ""),
      carrosserie: capitalize(v.inrichting || ""),
      vermogen: vermogenPk,
    };

    toast.success("Voertuiggegevens opgehaald via RDW ✓");
    return result;
  } catch (e) {
    console.warn("RDW fetch error:", e);
    toast.error("Kon RDW gegevens niet ophalen");
    return null;
  }
}
