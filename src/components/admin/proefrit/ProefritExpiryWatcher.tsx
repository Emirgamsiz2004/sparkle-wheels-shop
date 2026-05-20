import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTestDrives } from "@/hooks/useTestDrives";
import { getProefritDeadline } from "@/hooks/useProefritTimer";

/**
 * Globally watches active proefritten and pops a persistent toast when one expires.
 * Mount once in AdminLayout.
 */
const ProefritExpiryWatcher = () => {
  const { testDrives } = useTestDrives();
  const navigate = useNavigate();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      for (const td of testDrives) {
        if (td.status !== "actief") continue;
        const deadline = getProefritDeadline(td);
        if (!deadline) continue;
        if (now < deadline) continue;
        if (notifiedRef.current.has(td.id)) continue;
        notifiedRef.current.add(td.id);

        const naam = td.customer ? `${td.customer.voornaam} ${td.customer.achternaam}` : "Klant";
        const ken = td.voertuig_kenteken ? ` · ${td.voertuig_kenteken.toUpperCase()}` : "";
        toast.error(`⚠️ Proefrit ${naam}${ken} is voorbij. Sluit de proefrit af.`, {
          id: `proefrit-expired-${td.id}`,
          duration: Infinity,
          action: {
            label: "Afsluiten",
            onClick: () => navigate(`/admin/proefriten?afsluiten=${td.id}`),
          },
        });
      }
      // Clean up id's of test drives die niet meer actief zijn
      for (const id of Array.from(notifiedRef.current)) {
        const stillActive = testDrives.some((t) => t.id === id && t.status === "actief");
        if (!stillActive) {
          notifiedRef.current.delete(id);
          toast.dismiss(`proefrit-expired-${id}`);
        }
      }
    };
    check();
    const itv = setInterval(check, 15_000);
    return () => clearInterval(itv);
  }, [testDrives, navigate]);

  return null;
};

export default ProefritExpiryWatcher;
