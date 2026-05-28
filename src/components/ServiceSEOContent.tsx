import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export type SEOSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

interface ServiceSEOContentProps {
  intro?: string;
  sections: SEOSection[];
  /** Alternate dark/card background per section. Defaults to true. */
  alternate?: boolean;
}

/**
 * Long-form SEO content block for service pages.
 * Rendered as semantic <article> with H2 sections — designed
 * for Google to index high keyword density and topical depth.
 */
const ServiceSEOContent = ({ intro, sections, alternate = true }: ServiceSEOContentProps) => {
  return (
    <article>
      {intro && (
        <section className="py-12 md:py-20 bg-background">
          <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-base md:text-lg text-muted-foreground font-body font-light leading-relaxed"
            >
              {intro}
            </motion.p>
          </div>
        </section>
      )}

      {sections.map((section, idx) => {
        const bg = alternate
          ? idx % 2 === 0
            ? "bg-card"
            : "bg-background"
          : "bg-background";
        return (
          <section
            key={section.heading}
            className={`py-14 md:py-24 ${bg}`}
          >
            <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-6 leading-tight">
                  {section.heading}
                </h2>

                {section.paragraphs?.map((p, i) => (
                  <p
                    key={i}
                    className="text-muted-foreground font-body font-light leading-relaxed text-base md:text-lg mb-4 last:mb-0"
                  >
                    {p}
                  </p>
                ))}

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="space-y-3 mt-6">
                    {section.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-3 text-muted-foreground font-body font-light text-base md:text-lg"
                      >
                        <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </div>
          </section>
        );
      })}
    </article>
  );
};

export default ServiceSEOContent;
