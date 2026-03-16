const BRAND_ABBREVIATIONS = new Set([
  "BMW", "VW", "AMG", "KIA", "MG", "BYD", "GAC", "JAC", "FAW", "GWM",
]);

const MODEL_ABBREVIATIONS = new Set([
  "GTI", "TSI", "TDI", "AMG", "GTE", "GTD", "GTS", "RS", "ST", "FR",
  "TFSI", "FSI", "CDI", "HDI", "PHEV", "EV", "HEV", "AWD", "4WD",
  "SUV", "MPV", "CC", "GT", "SE", "SQ", "WRX", "STI", "XL", "LPG",
]);

const SLINE_PATTERN = /^s[-\s]?line$/i;
const MSPORT_PATTERN = /^m[-\s]?sport$/i;

export function capitalizeMerk(input: string): string {
  return input.replace(/\S+/g, (word) => {
    if (word === word.toUpperCase() && word.length >= 2) return word;
    if (BRAND_ABBREVIATIONS.has(word.toUpperCase())) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

export function capitalizeModel(input: string): string {
  return input.replace(/\S+/g, (word) => {
    const upper = word.toUpperCase();
    if (MODEL_ABBREVIATIONS.has(upper)) return upper;
    if (SLINE_PATTERN.test(word)) return "S-Line";
    if (MSPORT_PATTERN.test(word)) return "M-Sport";
    if (word === word.toUpperCase() && word.length >= 2) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

export function capitalizeKleur(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}
