import logo from "@/assets/logo.svg";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="PLA Auto's" className="h-8 w-auto" />
          </div>

          <div className="flex items-center gap-8">
            {["Home", "Diensten", "Over Ons", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-xs tracking-[0.15em] uppercase font-body text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <p className="text-xs text-muted-foreground font-body">
            © {new Date().getFullYear()} PLA Auto's
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
