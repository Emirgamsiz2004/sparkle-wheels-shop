import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show button after a short delay for better UX
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
        >
          <span className="bg-card border border-border px-3 py-1.5 text-xs font-medium text-foreground shadow-lg rounded-md">
            Stel een vraag
          </span>
          <a
            href="https://wa.me/31612693825"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg shadow-green-500/30 transition-all duration-300 hover:scale-110"
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-7 h-7 fill-current" />
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppButton;
