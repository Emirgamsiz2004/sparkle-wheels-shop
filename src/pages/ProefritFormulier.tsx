import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SignaturePad from "signature_pad";
import { CheckCircle2, Loader2, Car, AlertTriangle, Upload, X } from "lucide-react";
import { HelmetProvider, Helmet } from "react-helmet-async";

const OVEREENKOMST_TEKST = [
  "Bestuurder is aansprakelijk voor verkeersboetes begaan tijdens de proefrit.",
  "Bij schade door eigen schuld is bestuurder aansprakelijk voor het eigen risico.",
  "Bestuurder verklaart in het bezit te zijn van een geldig rijbewijs categorie B of hoger.",
  "Bestuurder verklaart nuchter te zijn en fysiek in staat om te rijden.",
];

const ProefritFormulier = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testDrive, setTestDrive] = useState<any>(null);

  const [voornaam, setVoornaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [adres, setAdres] = useState("");
  const [postcode, setPostcode] = useState("");
  const [plaats, setPlaats] = useState("");
  const [geboortedatum, setGeboortedatum] = useState("");
  const [rijbewijsnummer, setRijbewijsnummer] = useState("");
  const [rijbewijscategorie, setRijbewijscategorie] = useState("B");
  const [opmerkingen, setOpmerkingen] = useState("");
  const [akkoord, setAkkoord] = useState(false);
  const [rijbewijsFoto, setRijbewijsFoto] = useState<File | null>(null);
  const [rijbewijsFotoPreview, setRijbewijsFotoPreview] = useState<string | null>(null);
  const [rijbewijsFotoUploading, setRijbewijsFotoUploading] = useState(false);
  const [rijbewijsError, setRijbewijsError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const fetchTestDrive = async () => {
      if (!token) { setError("Ongeldige link"); setLoading(false); return; }
      
      const { data, error: err } = await supabase
        .from("test_drives")
        .select("*")
        .eq("token", token)
        .single();

      if (err || !data) {
        setError("Proefrit niet gevonden of link is verlopen");
        setLoading(false);
        return;
      }

      if (data.formulier_ingevuld_op) {
        setSubmitted(true);
      }

      setTestDrive(data);
      setLoading(false);
    };

    fetchTestDrive();
  }, [token]);

  useEffect(() => {
    if (canvasRef.current && !sigPadRef.current && !submitted) {
      const pad = new SignaturePad(canvasRef.current, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "rgb(0, 0, 0)",
      });
      sigPadRef.current = pad;

      pad.addEventListener("endStroke", () => {
        setHasSigned(!pad.isEmpty());
      });

      const resizeCanvas = () => {
        const canvas = canvasRef.current!;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")!.scale(ratio, ratio);
        pad.clear();
        setHasSigned(false);
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, [loading, submitted]);

  const clearSignature = () => {
    sigPadRef.current?.clear();
    setHasSigned(false);
  };

  const sanitizeRijbewijs = (val: string) => val.replace(/[\s\-]/g, "");

  const handleRijbewijsChange = (val: string) => {
    // Strip non-digits
    const clean = val.replace(/[^0-9\s\-]/g, "");
    setRijbewijsnummer(clean);
    const sanitized = sanitizeRijbewijs(clean);
    if (sanitized.length > 0 && (sanitized.length !== 10 || !/^\d{10}$/.test(sanitized))) {
      setRijbewijsError("Controleer je rijbewijsnummer — dit moet uit 10 cijfers bestaan");
    } else {
      setRijbewijsError(null);
    }
  };

  const handleRijbewijsFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setRijbewijsFoto(file);
    setRijbewijsFotoPreview(URL.createObjectURL(file));
  };

  const removeRijbewijsFoto = () => {
    setRijbewijsFoto(null);
    if (rijbewijsFotoPreview) URL.revokeObjectURL(rijbewijsFotoPreview);
    setRijbewijsFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const rijbewijsValid = (() => {
    const sanitized = sanitizeRijbewijs(rijbewijsnummer);
    return /^\d{10}$/.test(sanitized);
  })();

  const isValid = voornaam && achternaam && email && telefoon && adres && postcode && plaats && geboortedatum && rijbewijsValid && rijbewijsFoto && akkoord && hasSigned;

  const handleSubmit = async () => {
    if (!isValid || !testDrive || !sigPadRef.current || !rijbewijsFoto) return;
    setSubmitting(true);

    try {
      // Upload rijbewijs foto
      const fileExt = rijbewijsFoto.name.split(".").pop() || "jpg";
      const filePath = `${testDrive.id}/rijbewijs.${fileExt}`;
      const { error: uploadErr } = await supabase.storage
        .from("test-drive-files")
        .upload(filePath, rijbewijsFoto, { upsert: true });
      if (uploadErr) throw uploadErr;

      const sanitizedRijbewijs = sanitizeRijbewijs(rijbewijsnummer);

      // Upsert customer
      const { data: existingCustomer } = await supabase
        .from("test_drive_customers")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      let customerId: string;

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase.from("test_drive_customers").update({
          voornaam, achternaam, telefoon, adres: adres || null,
          postcode: postcode || null, plaats: plaats || null,
          geboortedatum: geboortedatum || null,
          rijbewijsnummer: sanitizedRijbewijs, rijbewijscategorie,
          rijbewijs_foto_path: filePath,
        } as any).eq("id", customerId);
      } else {
        const { data: newCust, error: custErr } = await supabase
          .from("test_drive_customers").insert({
            voornaam, achternaam, email, telefoon,
            adres: adres || null,
            postcode: postcode || null, plaats: plaats || null,
            geboortedatum: geboortedatum || null,
            rijbewijsnummer: sanitizedRijbewijs, rijbewijscategorie,
            rijbewijs_foto_path: filePath,
          } as any).select().single();
        if (custErr) throw custErr;
        customerId = newCust.id;
      }

      // Get signature data
      const signatureData = sigPadRef.current.toDataURL();

      // Fetch client IP address
      let clientIp = "";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        clientIp = ipData.ip || "";
      } catch { clientIp = "onbekend"; }

      // Update test drive
      const { error: tdErr } = await supabase.from("test_drives").update({
        customer_id: customerId,
        handtekening_data: signatureData,
        opmerkingen_voor: opmerkingen || null,
        formulier_ingevuld_op: new Date().toISOString(),
        status: "actief",
        ip_adres: clientIp,
      } as any).eq("id", testDrive.id);

      if (tdErr) throw tdErr;
      setSubmitted(true);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError("Er ging iets mis. Probeer het opnieuw.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error && !testDrive) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-neutral-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">Formulier ingediend</h1>
          <p className="text-neutral-600 text-sm">
            Bedankt! Uw proefritovereenkomst is succesvol ingediend. U ontvangt een bevestiging per e-mail.
          </p>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>Proefrit Formulier — Platin Automotive</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-lg mx-auto px-4 py-6 sm:py-10">
          {/* Header */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Proefrit</p>
                <p className="text-base font-semibold text-neutral-900">Platin Automotive</p>
              </div>
            </div>
            <div className="bg-neutral-50 rounded-lg p-3">
              <p className="font-medium text-neutral-900">{testDrive.voertuig_merk} {testDrive.voertuig_model}</p>
              <div className="flex gap-4 mt-1 text-sm text-neutral-500">
                {testDrive.voertuig_kenteken && <span className="font-mono uppercase">{testDrive.voertuig_kenteken}</span>}
                {testDrive.voertuig_bouwjaar && <span>{testDrive.voertuig_bouwjaar}</span>}
              </div>
            </div>
          </div>

          {/* Formulier */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4 space-y-4">
            <p className="text-sm font-semibold text-neutral-900">Uw gegevens</p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Voornaam *" value={voornaam} onChange={setVoornaam} />
              <Field label="Achternaam *" value={achternaam} onChange={setAchternaam} />
            </div>
            <Field label="E-mailadres *" value={email} onChange={setEmail} type="email" />
            <Field label="Telefoonnummer *" value={telefoon} onChange={setTelefoon} type="tel" />
            <Field label="Adres *" value={adres} onChange={setAdres} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Postcode *" value={postcode} onChange={setPostcode} placeholder="1234 AB" />
              <Field label="Plaats *" value={plaats} onChange={setPlaats} />
            </div>
            <Field label="Geboortedatum *" value={geboortedatum} onChange={setGeboortedatum} type="date" />
            
            <div className="pt-2 border-t border-neutral-100">
              <p className="text-sm font-semibold text-neutral-900 mb-3">Rijbewijs</p>
              
              {/* Rijbewijsnummer met validatie */}
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1">Rijbewijsnummer *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rijbewijsnummer}
                  onChange={(e) => handleRijbewijsChange(e.target.value)}
                  placeholder="0000000000"
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 ${
                    rijbewijsError ? "border-red-400 focus:ring-red-200" : "border-neutral-200 focus:ring-neutral-900/10"
                  }`}
                />
                {rijbewijsError && (
                  <p className="text-xs text-red-600 mt-1">{rijbewijsError}</p>
                )}
              </div>

              <div className="mt-3">
                <label className="text-xs font-medium text-neutral-600 block mb-1">Categorie</label>
                <select
                  value={rijbewijscategorie}
                  onChange={(e) => setRijbewijscategorie(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                >
                  <option value="B">B</option>
                  <option value="B+">B+</option>
                  <option value="BE">BE</option>
                </select>
              </div>

              {/* Rijbewijs foto upload */}
              <div className="mt-3">
                <label className="text-xs font-medium text-neutral-600 block mb-1">Foto rijbewijs (voorkant) *</label>
                <p className="text-[11px] text-neutral-400 mb-2">Zorg dat alle gegevens leesbaar zijn en er geen flits of schaduw op zit</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleRijbewijsFoto}
                  className="hidden"
                />
                
                {!rijbewijsFotoPreview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-neutral-300 rounded-lg py-6 flex flex-col items-center gap-2 text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-xs font-medium">Maak een foto of kies een bestand</span>
                  </button>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border border-neutral-200">
                    <img src={rijbewijsFotoPreview} alt="Rijbewijs" className="w-full h-auto max-h-48 object-contain bg-neutral-50" />
                    <button
                      type="button"
                      onClick={removeRijbewijsFoto}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm hover:bg-white transition-colors"
                    >
                      <X className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-100">
              <label className="text-xs font-medium text-neutral-600 block mb-1">
                Opmerkingen over de staat van de auto
              </label>
              <textarea
                value={opmerkingen}
                onChange={(e) => setOpmerkingen(e.target.value)}
                placeholder="Eventuele bestaande schade of bijzonderheden..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 resize-none"
              />
            </div>
          </div>

          {/* Overeenkomst */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4 space-y-3">
            <p className="text-sm font-semibold text-neutral-900">Proefritovereenkomst</p>
            <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
              {OVEREENKOMST_TEKST.map((tekst, i) => (
                <div key={i} className="flex gap-2 text-xs text-neutral-700">
                  <span className="shrink-0 w-4 h-4 bg-neutral-200 rounded-full flex items-center justify-center text-[10px] font-medium text-neutral-600">{i + 1}</span>
                  <span>{tekst}</span>
                </div>
              ))}
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={akkoord}
                onChange={(e) => setAkkoord(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300"
              />
              <span className="text-xs text-neutral-700">
                Ik ga akkoord met bovenstaande voorwaarden en verklaar dat alle opgegeven gegevens juist zijn.
              </span>
            </label>
          </div>

          {/* Handtekening */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-neutral-900">Handtekening *</p>
              <button onClick={clearSignature} className="text-xs text-neutral-500 hover:text-neutral-700">
                Wissen
              </button>
            </div>
            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white" style={{ touchAction: "none" }}>
              <canvas
                ref={canvasRef}
                className="w-full"
                style={{ height: "150px" }}
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">Teken hier met uw vinger</p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors ${
              isValid && !submitting
                ? "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            {submitting ? "Bezig met indienen..." : "Onderteken en indienen"}
          </button>

          {error && (
            <p className="text-center text-sm text-red-600 mt-3">{error}</p>
          )}

          <p className="text-center text-[11px] text-neutral-400 mt-4">
            Platin Automotive — Roelofarendsveen
          </p>
        </div>
      </div>
    </HelmetProvider>
  );
};

const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="text-xs font-medium text-neutral-600 block mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
    />
  </div>
);

export default ProefritFormulier;
