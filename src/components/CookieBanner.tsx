import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-4 md:p-6">
      <div className="mx-auto max-w-2xl bg-card border border-border rounded-xl p-5 shadow-2xl backdrop-blur-sm">
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Wij gebruiken cookies om uw ervaring op onze website te verbeteren. Noodzakelijke cookies zijn altijd actief. U kunt optionele cookies accepteren of weigeren.{" "}
          <Link to="/cookiebeleid" className="text-primary hover:underline">Lees meer</Link>
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={accept}
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Accepteren
          </button>
          <button
            onClick={decline}
            className="px-5 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Alleen noodzakelijk
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
