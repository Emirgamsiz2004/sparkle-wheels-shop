import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Calendar } from "lucide-react";
import AfspraakStickyPopover from "./AfspraakStickyPopover";

const HIDE_PATHS = ["/afspraak", "/admin", "/proefrit/"];

/**
 * Sticky "Afspraak maken" knop op de publieke website.
 * Bij klikken morpht de pill-knop vloeiend naar de afspraak-popover
 * (gedeelde layoutId "afspraak-cta").
 */
const WhatsAppButton = () => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const hidden = HIDE_PATHS.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (hidden) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, [hidden]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  if (hidden) return null;

  return (
    <LayoutGroup>
      <AnimatePresence mode="popLayout">
        {visible && !open && (
          <motion.button
            key="cta-btn"
            layoutId="afspraak-cta"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{
              borderRadius: 6,
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
            className="btn-public btn-sticky-public fixed z-50
              bottom-4 left-1/2 -translate-x-1/2 w-auto
              md:left-auto md:translate-x-0 md:right-5 md:bottom-5"
            aria-label="Afspraak maken"
          >
            <motion.span
              layout="position"
              className="inline-flex items-center gap-2"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <Calendar className="w-4 h-4" strokeWidth={2} />
              Afspraak maken
            </motion.span>
          </motion.button>

      <AnimatePresence>
        {open && <AfspraakStickyPopover open={open} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </LayoutGroup>
  );
};

export default WhatsAppButton;
