import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const services = [
  { label: "In- & Verkoop", href: "/diensten/in-en-verkoop" },
  { label: "Onderhoud & Reparatie", href: "/diensten/onderhoud-reparatie" },
  { label: "Detailing", href: "/diensten/auto-detailing" },
  { label: "Customizing", href: "/diensten/auto-customizing" },
  { label: "Auto op Aanvraag", href: "/diensten/auto-zoeken" },
];

const navLinks = [
  { label: "Home", href: "/", section: "home" },
  { label: "Voorraad", href: "/voorraad", section: "voorraad" },
  { label: "Consignatie", href: "/consignatie" },
  { label: "Diensten", href: "/#diensten", section: "diensten", hasDropdown: true },
  { label: "Over Ons", href: "/over-ons" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dienstenOpen, setDienstenOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (href: string, section?: string) => {
    if (section && location.pathname === "/") {
      const el = document.getElementById(section);
      if (el) { el.scrollIntoView({ behavior: "smooth" }); return; }
    }
    if (section) {
      navigate("/" + (section !== "home" ? `#${section}` : ""));
    } else {
      navigate(href);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
          scrolled && !mobileOpen ? "bg-background/70 backdrop-blur-xl border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex items-center justify-between py-5 px-5 md:px-[90px] max-w-[1920px]">
          <Link to="/" className="flex items-center gap-3 relative z-[60]">
            <img src={logo} alt="Platin Automotive" className="h-8 md:h-9 w-auto" style={{ imageRendering: 'auto' }} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) =>
              (link as any).hasDropdown ? (
                <div key={link.label} className="relative group/dropdown">
                  <button
                    onClick={() => handleNavClick(link.href, link.section)}
                    className="flex items-center gap-1 text-[10px] font-body font-medium tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
                  >
                    {link.label}
                    <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover/dropdown:rotate-180" />
                  </button>
                  <div className="absolute top-full left-0 pt-2 opacity-0 invisible translate-y-1 group-hover/dropdown:opacity-100 group-hover/dropdown:visible group-hover/dropdown:translate-y-0 transition-all duration-200 ease-out">
                    <div className="bg-card border border-border min-w-[190px] py-1.5 shadow-lg shadow-background/50">
                      {services.map((service) => (
                        <Link
                          key={service.label}
                          to={service.href}
                          className="block px-4 py-2.5 text-[10px] font-body font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors duration-150"
                        >
                          {service.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href, link.section)}
                  className="text-[10px] font-body font-medium tracking-[0.25em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  {link.label}
                </button>
              )
            )}
            <a
              href="tel:+31612693825"
              className="group relative flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-[10px] font-semibold tracking-[0.2em] uppercase transition-all hover:bg-primary hover:text-primary-foreground overflow-hidden h-[38px]"
            >
              <Phone className="w-3 h-3 relative z-10" />
              <span className="relative overflow-hidden h-[14px]">
                <span className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-[14px]">
                  <span className="h-[14px] flex items-center whitespace-nowrap">Neem Contact Op</span>
                  <span className="h-[14px] flex items-center whitespace-nowrap">06-12693825</span>
                </span>
              </span>
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-foreground relative w-5 h-5 z-[60]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <motion.span
              key={mobileOpen ? "close" : "open"}
              initial={{ opacity: 0, rotate: mobileOpen ? -90 : 90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: mobileOpen ? 90 : -90, scale: 0.5 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.span>
          </button>
        </div>
      </motion.nav>

      {/* Mobile fullscreen overlay menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-[55] bg-background/70 backdrop-blur-xl flex flex-col items-center justify-center gap-6"
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex flex-col items-center"
              >
                {(link as any).hasDropdown ? (
                  <>
                    <button
                      onClick={() => setDienstenOpen(!dienstenOpen)}
                      className="flex items-center gap-2 text-sm font-body font-medium tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${dienstenOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {dienstenOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden flex flex-col items-center gap-3 mt-3"
                        >
                          {services.map((service) => (
                            <Link
                              key={service.label}
                              to={service.href}
                              onClick={() => { setMobileOpen(false); setDienstenOpen(false); }}
                              className="text-xs font-body font-light tracking-[0.2em] uppercase text-muted-foreground/70 hover:text-foreground transition-colors"
                            >
                              {service.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <button
                    onClick={() => { handleNavClick(link.href, link.section); setMobileOpen(false); setDienstenOpen(false); }}
                    className="text-sm font-body font-medium tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </button>
                )}
              </motion.div>
            ))}
            <motion.a
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, delay: navLinks.length * 0.05 }}
              href="tel:+31612693825"
              className="group relative flex items-center gap-2 bg-foreground text-background px-6 py-3 text-[10px] font-semibold tracking-[0.2em] uppercase overflow-hidden h-[42px] mt-4 hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <Phone className="w-3 h-3 relative z-10" />
              <span className="relative overflow-hidden h-[14px]">
                <span className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-[14px]">
                  <span className="h-[14px] flex items-center whitespace-nowrap">Neem Contact Op</span>
                  <span className="h-[14px] flex items-center whitespace-nowrap">06-12693825</span>
                </span>
              </span>
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;