import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export type SEOSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

interface ServiceSEOContentProps {
  /** Eyebrow label above the block (e.g. "Meer over deze dienst") */
  eyebrow?: string;
  /** Optional intro paragraph shown above the section list */
  intro?: string;
  sections: SEOSection[];
}

/**
 * Long-form SEO content block for service pages.
 *
 * Editorial two-column layout:
 *   - Left rail: zero-padded section index + short heading
 *   - Right column: body copy and bullets
 * Sections are separated by thin hairlines and share a single
 * continuous background — tight, scannable, magazine-like.
 */
const ServiceSEOContent = ({ eyebrow, intro, sections }: ServiceSEOContentProps) => {
  return (
    <section className="py-20 md:py-32 bg-background border-t border-border">
      <div className="container mx-auto px-6 lg:px-16 max-w-6xl">
        {(eyebrow || intro) && (
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 md:mb-24 max-w-3xl"
          >
            {eyebrow && (
              <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-4">
                {eyebrow}
              </p>
            )}
            {intro && (
              <p className="text-lg md:text-xl text-foreground/80 font-body font-light leading-relaxed">
                {intro}
              </p>
            )}
          </motion.header>
        )}

        <div className="divide-y divide-border/60">
          {sections.map((section, idx) => (
            <motion.article
              key={section.heading}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 py-10 md:py-14 first:pt-0 last:pb-0"
            >
              {/* Left rail — number + heading */}
              <div className="md:col-span-5 lg:col-span-4">
                <div className="flex items-baseline gap-4">
                  <span className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground tabular-nums shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground tracking-tight leading-snug">
                    {section.heading}
                  </h2>
                </div>
              </div>

              {/* Right column — copy */}
              <div className="md:col-span-7 lg:col-span-8 md:pl-6 md:border-l md:border-border/60">
                {section.paragraphs?.map((p, i) => (
                  <p
                    key={i}
                    className="text-muted-foreground font-body font-light leading-relaxed text-base md:text-[17px] mb-4 last:mb-0"
                  >
                    {p}
                  </p>
                ))}

                {section.bullets && section.bullets.length > 0 && (
                  <ul className="space-y-2.5 mt-5">
                    {section.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-3 text-muted-foreground font-body font-light text-base md:text-[17px]"
                      >
                        <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceSEOContent;
