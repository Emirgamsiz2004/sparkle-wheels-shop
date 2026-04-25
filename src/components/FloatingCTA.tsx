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
          <button onClick={handleClick} className="btn-public btn-primary-public shadow-lg shadow-black/30">
            <CalendarCheck className="w-4 h-4" />
            {label}
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
