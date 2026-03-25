import { motion } from "framer-motion";
import { useVoorraadFeed } from "@/hooks/useVoorraadFeed";
import VoorraadCard from "@/components/VoorraadCard";

interface Props {
  currentId: string;
}

const RelatedVehicles = ({ currentId }: Props) => {
  const { data: voertuigen } = useVoorraadFeed();

  if (!voertuigen || voertuigen.length <= 1) return null;

  const others = voertuigen.filter((v) => v.id !== currentId).slice(0, 6);

  if (others.length === 0) return null;

  return (
    <section className="pb-20 lg:pb-28">
      <div className="container mx-auto px-4 lg:px-16 max-w-[1920px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
            Meer uit voorraad
          </p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-8">
            Bekijk ook
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {others.map((v, i) => (
            <VoorraadCard key={v.id} voertuig={v} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedVehicles;
