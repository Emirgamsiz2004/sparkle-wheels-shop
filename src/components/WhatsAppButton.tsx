import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isAdmin) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="https://wa.me/31612693825"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 bg-foreground text-background px-5 py-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase">
            Stel een vraag
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppButton;