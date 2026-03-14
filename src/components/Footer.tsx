import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { Instagram, MessageCircle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px] py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <Link to="/">
            <img src={logo} alt="Platin Automotive" className="h-8 md:h-9 w-auto opacity-60 hover:opacity-100 transition-opacity" />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { label: "Home", href: "/" },
              { label: "Voorraad", href: "/voorraad" },
              { label: "Consignatie", href: "/consignatie" },
              { label: "Over Ons", href: "/over-ons" },
              { label: "Contact", href: "/contact" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col items-center md:items-end gap-3">
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/platin_automotive"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://wa.me/31612693825"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.marktplaats.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                aria-label="Marktplaats"
              >
                <span className="text-[9px] font-display font-bold leading-none">MP</span>
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground font-body tracking-wider">
              © {new Date().getFullYear()} Platin Automotive
            </p>
            <p className="text-[10px] text-muted-foreground/70 font-body tracking-wider">
              Cilinderweg 99, 2371 DZ Roelofarendsveen
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
