import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, X } from "lucide-react";

interface FloatingCTAProps {
  targetId: string;
  label?: string;
}

const FloatingCTA = ({ targetId, label = "Afspraak maken" }: FloatingCTAProps) => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2"
        >
          <button
            onClick={handleClick}
            className="group/cta relative flex items-center gap-2.5 bg-muted border border-border text-foreground px-5 py-3 shadow-lg shadow-black/30 overflow-hidden transition-all duration-500 hover:border-accent hover:text-accent"
          >
            <span className="absolute inset-0 bg-accent/10 origin-left scale-x-0 group-hover/cta:scale-x-100 transition-transform duration-500 ease-out" />
            <CalendarCheck className="w-4 h-4 relative z-10" />
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase relative z-10">{label}</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="bg-card border border-border p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Sluiten"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTA;
