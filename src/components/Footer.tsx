import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

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

          <div className="flex flex-col items-center md:items-end gap-1">
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
