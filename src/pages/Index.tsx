import { Helmet } from "react-helmet-async";
import AnnouncementBar from "@/components/AnnouncementBar";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import InventorySection from "@/components/InventorySection";
import ConsignatieSection from "@/components/ConsignatieSection";
import ServicesSection from "@/components/ServicesSection";
import AboutSection from "@/components/AboutSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import LatestBlogSection from "@/components/LatestBlogSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Occasions Kopen & Verkopen in Roelofarendsveen | Platin Automotive</title>
        <meta name="description" content="Platin Automotive in Roelofarendsveen — betrouwbare occasions, auto detailing, onderhoud en consignatie verkoop. Persoonlijk advies, eerlijke prijzen. Bel 06-12693825." />
        <meta name="keywords" content="occasions Roelofarendsveen, auto kopen Roelofarendsveen, auto detailing, consignatie verkoop, auto onderhoud" />
        <link rel="canonical" href="https://platinautomotive.nl/" />
        <meta property="og:title" content="Platin Automotive | Occasions & Detailing Roelofarendsveen" />
        <meta property="og:description" content="Betrouwbare occasions, detailing en consignatie in Roelofarendsveen. Eerlijke prijzen, persoonlijk advies." />
        <meta property="og:url" content="https://platinautomotive.nl/" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <AnnouncementBar />
      <div className="h-[33px]" /> {/* spacer for fixed announcement bar */}
      <Navbar />
      <HeroSection />
      <InventorySection />
      <ConsignatieSection />
      <ServicesSection />
      <AboutSection />
      <ReviewsSection />
      <ContactSection />
      <LatestBlogSection />
      <Footer />
    </div>
  );
};

export default Index;
