import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import InventorySection from "@/components/InventorySection";
import ServicesSection from "@/components/ServicesSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import FinancieringSection from "@/components/FinancieringSection";
import GarantieSection from "@/components/GarantieSection";
import DetailingCTASection from "@/components/DetailingCTASection";
import HomeAboutSection from "@/components/HomeAboutSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Occasions & Detailing Roelofarendsveen | Platin Automotive</title>
        <meta name="description" content="Platin Automotive – uw betrouwbare autohandelaar in Roelofarendsveen. Occasions, detailing, onderhoud & consignatie. RDW-erkend. Bel of WhatsApp ons!" />
        <link rel="canonical" href="https://platinautomotive.nl/" />
        <meta property="og:title" content="Occasions & Detailing Roelofarendsveen | Platin Automotive" />
        <meta property="og:description" content="Betrouwbare occasions, detailing en consignatie in Roelofarendsveen. Eerlijke prijzen, persoonlijk advies." />
        <meta property="og:image" content="https://platinautomotive.nl/images/platin-og-logo-v2.jpg?v=2" />
        <meta property="og:image:secure_url" content="https://platinautomotive.nl/images/platin-og-logo-v2.jpg?v=2" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://platinautomotive.nl/images/platin-og-logo-v2.jpg?v=2" />
        <meta property="og:url" content="https://platinautomotive.nl/" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Kopen jullie ook auto's in?", acceptedAnswer: { "@type": "Answer", text: "Ja, wij kopen auto's in. We beoordelen altijd of het voertuig past binnen ons aanbod. Past de auto bij ons, dan nemen we hem graag over. Past hij er niet tussen, dan kunnen we alsnog een bod doen via ons partnernetwerk." } },
            { "@type": "Question", name: "Bieden jullie garantie aan?", acceptedAnswer: { "@type": "Answer", text: "Ja. Wij werken samen met AutoTrust, een dochteronderneming van BOVAG, en bieden officiële AutoTrust-garantiepakketten aan op voertuigen die daarvoor in aanmerking komen." } },
            { "@type": "Question", name: "Doen jullie ook onderhoud en reparaties?", acceptedAnswer: { "@type": "Answer", text: "Ja, wij voeren klein onderhoud en reparaties uit. APK-keuringen voeren wij zelf niet uit, maar voor overig onderhoud en herstelwerk kunt u bij ons terecht." } },
            { "@type": "Question", name: "Hoe kan ik betalen?", acceptedAnswer: { "@type": "Answer", text: "Wij accepteren pinbetaling, contant (tot € 3.000), bankoverschrijving en financiering via financiallease.nl." } },
            { "@type": "Question", name: "Moet ik een afspraak maken om langs te komen?", acceptedAnswer: { "@type": "Answer", text: "U bent altijd welkom tijdens onze openingstijden, zonder afspraak. Voor een specifieke auto is het fijn als u even laat weten dat u komt." } },
            { "@type": "Question", name: "Kunnen jullie een auto bezorgen?", acceptedAnswer: { "@type": "Answer", text: "Ja, bezorging is mogelijk naar uw gewenste locatie. Hier zijn bezorgkosten aan verbonden." } },
          ],
        })}</script>
      </Helmet>
      <Navbar />
      <HeroSection />
      <InventorySection />
      <DetailingCTASection />
      <HomeAboutSection />
      <FinancieringSection />
      <GarantieSection />
      <ServicesSection />
      <ReviewsSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
