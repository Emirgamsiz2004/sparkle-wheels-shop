import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Upload, X } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface FormData {
  // Stap 1: Persoonlijke gegevens
  naam: string;
  telefoon: string;
  email: string;
  // Stap 2: Voertuiggegevens
  merk: string;
  model: string;
  bouwjaar: string;
  kmStand: string;
  brandstof: string;
  transmissie: string;
  kleur: string;
  // Stap 3: Staat
  schadevrij: boolean | null;
  onderhoudsboekje: boolean | null;
  apkGeldig: boolean | null;
  rookvrij: boolean | null;
  eersteEigenaar: boolean | null;
  // Stap 4: Foto's & opmerkingen
  opmerkingen: string;
}

const initialData: FormData = {
  naam: "",
  telefoon: "",
  email: "",
  merk: "",
  model: "",
  bouwjaar: "",
  kmStand: "",
  brandstof: "",
  transmissie: "",
  kleur: "",
  schadevrij: null,
  onderhoudsboekje: null,
  apkGeldig: null,
  rookvrij: null,
  eersteEigenaar: null,
  opmerkingen: "",
};

const totalSteps = 4;

const YesNoToggle = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (val: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-4 border-b border-border">
    <span className="text-sm font-body text-foreground">{label}</span>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-5 py-2 text-xs font-body font-medium tracking-[0.1em] uppercase transition-all duration-200 ${
          value === true
            ? "bg-foreground text-background"
            : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
        }`}
      >
        Ja
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-5 py-2 text-xs font-body font-medium tracking-[0.1em] uppercase transition-all duration-200 ${
          value === false
            ? "bg-foreground text-background"
            : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
        }`}
      >
        Nee
      </button>
    </div>
  </div>
);

const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-body font-medium tracking-[0.2em] uppercase text-muted-foreground">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent border-b border-border py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/50 transition-colors"
    />
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-body font-medium tracking-[0.2em] uppercase text-muted-foreground">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-b border-border py-3 text-sm font-body text-foreground focus:outline-none focus:border-foreground/50 transition-colors appearance-none cursor-pointer"
    >
      <option value="" className="bg-card text-foreground">Selecteer...</option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-card text-foreground">
          {opt}
        </option>
      ))}
    </select>
  </div>
);

const Consignatie = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initialData);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = [...photos, ...files].slice(0, 10);
    setPhotos(newPhotos);

    const newUrls = newPhotos.map((file) => URL.createObjectURL(file));
    setPhotoPreviewUrls(newUrls);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviewUrls(newPhotos.map((file) => URL.createObjectURL(file)));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.naam && data.telefoon && data.email;
      case 2:
        return data.merk && data.model && data.bouwjaar && data.kmStand;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    toast.success("Uw aanmelding is verzonden! Wij nemen zo snel mogelijk contact met u op.");
    setData(initialData);
    setPhotos([]);
    setPhotoPreviewUrls([]);
    setStep(1);
  };

  const stepLabels = ["Uw Gegevens", "Voertuig", "Staat", "Foto's & Verzenden"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-32 pb-28 lg:pb-36">
        <div className="container mx-auto px-6 lg:px-16 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Terug naar home
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-14"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Consignatie
            </p>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4">
              Meld uw auto aan
            </h1>
            <p className="text-sm font-body font-light text-muted-foreground leading-relaxed">
              Vul de onderstaande gegevens in en wij nemen zo snel mogelijk contact met u op.
            </p>
          </motion.div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-14">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-px w-full transition-colors duration-500 ${
                    i + 1 <= step ? "bg-foreground" : "bg-border"
                  }`}
                />
                <p
                  className={`text-[9px] tracking-[0.2em] uppercase font-body mt-2 transition-colors duration-300 ${
                    i + 1 <= step ? "text-foreground" : "text-muted-foreground/40"
                  }`}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              {step === 1 && (
                <div className="space-y-8">
                  <InputField label="Naam" value={data.naam} onChange={(v) => update("naam", v)} placeholder="Uw volledige naam" />
                  <InputField label="Telefoonnummer" value={data.telefoon} onChange={(v) => update("telefoon", v)} placeholder="06 - 1234 5678" type="tel" />
                  <InputField label="E-mailadres" value={data.email} onChange={(v) => update("email", v)} placeholder="uw@email.nl" type="email" />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <InputField label="Merk" value={data.merk} onChange={(v) => update("merk", v)} placeholder="Bijv. Volkswagen" />
                  <InputField label="Model" value={data.model} onChange={(v) => update("model", v)} placeholder="Bijv. Golf" />
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Bouwjaar" value={data.bouwjaar} onChange={(v) => update("bouwjaar", v)} placeholder="Bijv. 2019" />
                    <InputField label="KM-stand" value={data.kmStand} onChange={(v) => update("kmStand", v)} placeholder="Bijv. 85.000" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <SelectField label="Brandstof" value={data.brandstof} onChange={(v) => update("brandstof", v)} options={["Benzine", "Diesel", "Hybride", "Elektrisch", "LPG"]} />
                    <SelectField label="Transmissie" value={data.transmissie} onChange={(v) => update("transmissie", v)} options={["Handgeschakeld", "Automaat"]} />
                  </div>
                  <InputField label="Kleur" value={data.kleur} onChange={(v) => update("kleur", v)} placeholder="Bijv. Zwart metallic" />
                </div>
              )}

              {step === 3 && (
                <div>
                  <YesNoToggle label="Is de auto schadevrij?" value={data.schadevrij} onChange={(v) => update("schadevrij", v)} />
                  <YesNoToggle label="Heeft u een onderhoudsboekje?" value={data.onderhoudsboekje} onChange={(v) => update("onderhoudsboekje", v)} />
                  <YesNoToggle label="Is de APK nog geldig?" value={data.apkGeldig} onChange={(v) => update("apkGeldig", v)} />
                  <YesNoToggle label="Is de auto rookvrij bereden?" value={data.rookvrij} onChange={(v) => update("rookvrij", v)} />
                  <YesNoToggle label="Bent u de eerste eigenaar?" value={data.eersteEigenaar} onChange={(v) => update("eersteEigenaar", v)} />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-10">
                  {/* Photo upload */}
                  <div>
                    <p className="text-[10px] font-body font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
                      Foto's (max. 10)
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {photoPreviewUrls.map((url, i) => (
                        <div key={i} className="relative aspect-square bg-card overflow-hidden group">
                          <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 bg-background/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3 text-foreground" />
                          </button>
                        </div>
                      ))}
                      {photos.length < 10 && (
                        <label className="aspect-square border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-foreground/30 transition-colors">
                          <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                          <span className="text-[9px] font-body text-muted-foreground">Toevoegen</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoAdd}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Opmerkingen */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-body font-medium tracking-[0.2em] uppercase text-muted-foreground">
                      Opmerkingen
                    </label>
                    <textarea
                      value={data.opmerkingen}
                      onChange={(e) => update("opmerkingen", e.target.value)}
                      placeholder="Heeft u nog iets toe te voegen? Bijv. extra opties, recente reparaties, vraagprijs..."
                      rows={4}
                      className="w-full bg-transparent border border-border p-4 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors resize-none"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-14">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Vorige
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                onClick={() => canProceed() && setStep(step + 1)}
                className={`flex items-center gap-2 px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-300 ${
                  canProceed()
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Doorgaan
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-foreground/90 transition-all duration-300"
              >
                Versturen
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Consignatie;
