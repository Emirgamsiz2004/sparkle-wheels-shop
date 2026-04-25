import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs: { question: string; answer: string; link?: string; linkText?: string }[] = [
  {
    question: "Kopen jullie ook auto's in?",
    answer:
      "Ja, wij kopen auto's in. We beoordelen altijd of het voertuig past binnen ons aanbod. Past de auto bij ons, dan nemen we hem graag over. Past hij er niet tussen, dan kunnen we alsnog een bod doen — het voertuig wordt dan doorverkocht via ons partnernetwerk, waardoor de inkoopprijs iets lager uitvalt. Neem gerust contact op voor een vrijblijvende taxatie.",
  },
  {
    question: "Bieden jullie garantie aan?",
    answer:
      "Ja. Wij werken samen met AutoTrust, een dochteronderneming van BOVAG. Via deze samenwerking bieden wij officiële AutoTrust-garantiepakketten aan op voertuigen die daarvoor in aanmerking komen. Zo rijdt u met zekerheid weg.",
    link: "/garantie",
    linkText: "Bekijk onze garantiepakketten",
  },
  {
    question: "Doen jullie ook onderhoud en reparaties?",
    answer:
      "Ja, wij voeren klein onderhoud en reparaties uit. APK-keuringen voeren wij zelf niet uit, maar voor overig onderhoud en herstelwerk kunt u bij ons terecht.",
  },
  {
    question: "Hoe kan ik betalen?",
    answer:
      "Wij accepteren pinbetaling, contant (tot € 3.000), bankoverschrijving en financiering. Voor financiering werken wij samen met financiallease.nl — wij verzorgen de aanvraag graag voor u. Vraag ernaar tijdens uw bezoek.",
  },
  {
    question: "Moet ik een afspraak maken om langs te komen?",
    answer:
      "U bent altijd welkom tijdens onze openingstijden, zonder afspraak. Wilt u een specifieke auto bezichtigen? Laat dan even weten dat u komt en voor welke auto, zodat wij het voertuig klaar kunnen zetten. Buiten openingstijden zijn wij beschikbaar op afspraak.",
  },
  {
    question: "Kunnen jullie een auto bezorgen?",
    answer:
      "Ja, bezorging is mogelijk. Wij brengen de auto naar uw gewenste locatie, bijvoorbeeld uw thuis- of werkadres. Hier zijn bezorgkosten aan verbonden. Neem contact op voor meer informatie.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-16 md:py-28 bg-card">
      <div className="container mx-auto px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
            FAQ
          </p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
            Veelgestelde Vragen
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border-b border-border px-0 last:border-b-0"
              >
                <AccordionTrigger className="text-left text-sm md:text-base font-semibold font-body text-foreground hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground font-body font-light leading-relaxed pb-5">
                  {faq.answer}
                  {faq.link && (
                    <Link
                      to={faq.link}
                      className="btn-public btn-secondary-public mt-3"
                    >
                      {faq.linkText}
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
