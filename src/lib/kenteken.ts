const patterns: [RegExp, string][] = [
  [/^([A-Z]{2})(\d{2})([A-Z]{2})$/, "$1-$2-$3"],
  [/^(\d{2})([A-Z]{2})(\d{2})$/, "$1-$2-$3"],
  [/^([A-Z]{2})([A-Z]{2})(\d{2})$/, "$1-$2-$3"],
  [/^(\d{2})(\d{2})([A-Z]{2})$/, "$1-$2-$3"],
  [/^([A-Z]{2})(\d{3})([A-Z])$/, "$1-$2-$3"],
  [/^([A-Z])(\d{3})([A-Z]{2})$/, "$1-$2-$3"],
  [/^([A-Z]{3})(\d{2})([A-Z])$/, "$1-$2-$3"],
  [/^([A-Z])(\d{2})([A-Z]{3})$/, "$1-$2-$3"],
  [/^(\d{2})([A-Z]{3})(\d)$/, "$1-$2-$3"],
  [/^(\d)([A-Z]{3})(\d{2})$/, "$1-$2-$3"],
];

export function formatKenteken(input: string): string {
  const clean = input.replace(/[-\s]/g, "").toUpperCase();
  for (const [regex, replacement] of patterns) {
    if (regex.test(clean)) {
      return clean.replace(regex, replacement);
    }
  }
  return clean;
}

export function isValidKenteken(input: string): boolean {
  const clean = input.replace(/[-\s]/g, "").toUpperCase();
  return patterns.some(([regex]) => regex.test(clean));
}
