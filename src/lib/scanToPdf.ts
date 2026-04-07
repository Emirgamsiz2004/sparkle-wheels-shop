import jsPDF from "jspdf";

/**
 * Takes a camera image file (photo of a document) and converts it
 * into a clean, high-contrast black & white PDF that looks like a scan.
 */
export async function convertImageToScanPdf(imageFile: File): Promise<File> {
  const img = await loadImage(imageFile);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Apply scan effect: grayscale + high contrast + threshold
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const threshold = 140; // Adjust for scan darkness

  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    // Apply contrast enhancement
    const enhanced = gray < threshold ? 0 : 255;
    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }

  ctx.putImageData(imageData, 0, 0);

  // Create PDF with the processed image
  const aspectRatio = img.width / img.height;
  const isLandscape = aspectRatio > 1;
  const pdf = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Fit image to page with margins
  const margin = 5;
  const maxW = pageWidth - margin * 2;
  const maxH = pageHeight - margin * 2;
  let w = maxW;
  let h = w / aspectRatio;
  if (h > maxH) {
    h = maxH;
    w = h * aspectRatio;
  }
  const x = (pageWidth - w) / 2;
  const y = (pageHeight - h) / 2;

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  pdf.addImage(dataUrl, "JPEG", x, y, w, h);

  const pdfBlob = pdf.output("blob");
  const baseName = imageFile.name.replace(/\.[^.]+$/, "");
  return new File([pdfBlob], `${baseName}-scan.pdf`, { type: "application/pdf" });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
