import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Car, ClipboardCheck, ListTodo, CalendarDays, Shield, CheckCheck } from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { AnimatePresence, motion } from "framer-motion";

const typeIcons: Record<string, typeof Bell> = {
  apk_warning: Shield,
  apk_expired: Shield,
  stock_60days: Car,
  stock_90days: Car,
  proefrit_form_completed: ClipboardCheck,
  proefrit_form_pending: ClipboardCheck,
  task_due_today: ListTodo,
  task_overdue: ListTodo,
  appointment_soon: CalendarDays,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Zojuist";
  if (mins < 60) return `${mins}m geleden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}u geleden`;
  const days = Math.floor(hours / 24);
  return `${days}d geleden`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (n: Notification) => {
    if (!n.read) markRead(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-red-500 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-[340px] max-h-[420px] bg-card border border-border shadow-xl z-50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground font-['Poppins']">Meldingen</span>
              {unreadCount > 0 && (
                <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {unreadCount} nieuw
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Geen meldingen</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type] || Bell;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/50 ${!n.read ? "bg-accent/20" : ""}`}
                    >
                      <div className={`mt-0.5 p-1.5 rounded-md ${!n.read ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] leading-snug ${!n.read ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 mt-0.5">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={() => { markAllRead(); }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-[12px] text-muted-foreground hover:text-foreground border-t border-border transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Alles als gelezen markeren
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
