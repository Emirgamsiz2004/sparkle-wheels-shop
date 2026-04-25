import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Calendar } from "lucide-react";
import AfspraakStickyPopover from "./AfspraakStickyPopover";

const HIDE_PATHS = ["/afspraak", "/admin", "/proefrit/"];

const AfspraakStickyButton = () => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const hidden = HIDE_PATHS.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (hidden) { setVisible(false); return; }
    const onScroll = () => setVisible(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ borderRadius: 9999 }}
            className="fixed z-40 inline-flex items-center justify-center gap-2
              bottom-4 left-1/2 -translate-x-1/2 w-[80%]
              md:left-auto md:translate-x-0 md:right-8 md:bottom-8 md:w-auto
              px-6 py-3.5 bg-primary text-primary-foreground font-semibold text-sm
              shadow-lg shadow-primary/30 hover:scale-[1.03] transition-transform"
          >
            <motion.span
              layout="position"
              className="inline-flex items-center gap-2"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <Calendar className="w-4 h-4" />
              Afspraak maken
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && <AfspraakStickyPopover open={open} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </LayoutGroup>
  );
};

export default AfspraakStickyButton;
