import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
// import InventorySection from "@/components/InventorySection"; // Verborgen tot echte voorraad gekoppeld is
import ConsignatieSection from "@/components/ConsignatieSection";
import ServicesSection from "@/components/ServicesSection";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <InventorySection />
      <ConsignatieSection />
      <ServicesSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
