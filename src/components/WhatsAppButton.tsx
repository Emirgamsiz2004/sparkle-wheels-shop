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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-500 ease-out shadow-lg shadow-foreground/20"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </motion.a>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppButton;