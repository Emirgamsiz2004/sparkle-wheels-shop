import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";

const HIDE_PATHS = ["/afspraak", "/admin", "/proefrit/"];

const AfspraakStickyButton = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  const hidden = HIDE_PATHS.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (hidden) { setVisible(false); return; }
    const onScroll = () => setVisible(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hidden]);

  if (hidden) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="fixed z-40
            bottom-4 left-1/2 -translate-x-1/2 w-[80%]
            md:left-auto md:translate-x-0 md:right-8 md:bottom-8 md:w-auto
            "
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
        >
          <Link
            to="/afspraak"
            className="flex items-center justify-center gap-2 w-full md:w-auto rounded-full px-6 py-3.5 bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/30 hover:scale-[1.03] transition-transform"
          >
            <Calendar className="w-4 h-4" />
            Afspraak maken
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AfspraakStickyButton;
