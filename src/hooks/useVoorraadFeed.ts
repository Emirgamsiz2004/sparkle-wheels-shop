import { useQuery } from "@tanstack/react-query";

export interface VoorraadVoertuig {
  id: string;
  merk: string;
  model: string;
  type: string;
  bouwjaar: string;
  brandstof: string;
  transmissie: string;
  kilometerstand: string;
  carrosserie: string;
  kleur: string;
  prijs: number;
  afbeelding: string;
  url: string;
}

const FEED_URL =
  "https://api.allorigins.win/get?url=" +
  encodeURIComponent("https://svl.autodealers.nl/occasions.aspx?did=91347&format=xml");

function getText(el: Element | null, tag: string): string {
  return el?.getElementsByTagName(tag)?.[0]?.textContent?.trim() ?? "";
}

async function fetchVoorraad(): Promise<VoorraadVoertuig[]> {
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error("Feed niet beschikbaar");

  const json = await res.json();
  const xml = json.contents as string;
  if (!xml) throw new Error("Lege feed ontvangen");

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const errorNode = doc.querySelector("parsererror");
  if (errorNode) throw new Error("Ongeldige XML feed");

  const items = doc.getElementsByTagName("occasion");
  const vehicles: VoorraadVoertuig[] = [];

  for (let i = 0; i < items.length; i++) {
    const el = items[i];
    const prijs = parseInt(getText(el, "verkoopprijs") || getText(el, "vraagprijs") || "0", 10);
    const afbeelding =
      getText(el, "hoofdfoto") ||
      getText(el, "foto1") ||
      getText(el, "afbeelding") ||
      "";

    vehicles.push({
      id: getText(el, "voertuignr") || getText(el, "id") || String(i),
      merk: getText(el, "merk"),
      model: getText(el, "model") || getText(el, "handelsbenaming"),
      type: getText(el, "type") || getText(el, "uitvoering"),
      bouwjaar: getText(el, "bouwjaar") || getText(el, "datum_deel_1"),
      brandstof: getText(el, "brandstof"),
      transmissie: getText(el, "transmissie"),
      kilometerstand: getText(el, "tellerstand") || getText(el, "kilometerstand"),
      carrosserie: getText(el, "carrosserie") || getText(el, "soort"),
      kleur: getText(el, "kleur"),
      prijs,
      afbeelding,
      url: getText(el, "detailpagina_url") || getText(el, "url") || "",
    });
  }

  return vehicles;
}

export function useVoorraadFeed() {
  return useQuery({
    queryKey: ["voorraad-feed"],
    queryFn: fetchVoorraad,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
