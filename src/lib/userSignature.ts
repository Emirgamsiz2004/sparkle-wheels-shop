import { supabase } from "@/integrations/supabase/client";

let cached: { url: string | null; dataUrl: string | null } = { url: null, dataUrl: null };

/** Haal een bruikbare signature URL op voor de ingelogde admin.
 *  signature_url bevat sinds privacy-hardening een storage path. Legacy
 *  records met een volledige URL worden ook ondersteund.
 */
export async function getCurrentUserSignatureUrl(): Promise<string | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return null;
  const { data } = await supabase
    .from("profiles")
    .select("signature_url")
    .eq("user_id", uid)
    .maybeSingle();
  const raw = (data as any)?.signature_url || null;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw; // legacy
  const { data: signed } = await supabase.storage
    .from("signatures")
    .createSignedUrl(raw, 60 * 60);
  return signed?.signedUrl || null;
}

/** Convert URL → PNG dataURL voor embedding in PDF (jsPDF.addImage of <img>). */
export async function fetchSignatureDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  if (cached.url === url && cached.dataUrl) return cached.dataUrl;
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    cached = { url, dataUrl };
    return dataUrl;
  } catch {
    return null;
  }
}

/** Combineert beide stappen; geeft dataURL terug of null. */
export async function getCurrentUserSignatureDataUrl(): Promise<string | null> {
  const url = await getCurrentUserSignatureUrl();
  return fetchSignatureDataUrl(url);
}
