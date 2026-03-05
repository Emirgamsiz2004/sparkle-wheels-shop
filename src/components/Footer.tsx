import logo from "@/assets/logo.svg";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="mx-auto px-[75px] max-w-[1920px] py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <a href="#home">
            <img src={logo} alt="Platin Automotive" className="h-8 md:h-9 w-auto opacity-60 hover:opacity-100 transition-opacity" />
          </a>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {["Home", "Diensten", "Over Ons", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
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