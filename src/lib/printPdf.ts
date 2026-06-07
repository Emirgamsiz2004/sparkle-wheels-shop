/**
 * Print een PDF-blob direct vanuit de huidige pagina via een verborgen iframe.
 * Geen nieuw tabblad nodig — het printvenster opent in dezelfde tab.
 *
 * @returns object URL van de PDF (kan hergebruikt worden voor "Opnieuw printen").
 */
export function printPdfBlob(blob: Blob, frameId = "pdf-print-frame"): string {
  const url = URL.createObjectURL(blob);

  try {
    const existing = document.getElementById(frameId) as HTMLIFrameElement | null;
    if (existing) existing.remove();

    const iframe = document.createElement("iframe");
    iframe.id = frameId;
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = url;
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.open(url, "_blank");
        }
      }, 400);
    };
    document.body.appendChild(iframe);
  } catch {
    window.open(url, "_blank");
  }

  return url;
}

/**
 * Roep print() opnieuw aan op een eerder gegenereerde iframe.
 * Fallback: open de bewaarde URL in een nieuw tabblad.
 */
export function reprintPdf(url: string | null, frameId = "pdf-print-frame") {
  if (!url) return;
  const iframe = document.getElementById(frameId) as HTMLIFrameElement | null;
  if (iframe?.contentWindow) {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      return;
    } catch {
      // val terug op nieuw tabblad
    }
  }
  window.open(url, "_blank");
}
