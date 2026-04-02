import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Kopen jullie ook auto's in?",
    answer:
      "Ja, wij kopen auto's in. We kijken daarbij wel of het voertuig past binnen ons aanbod. Past de auto bij ons, dan nemen we hem graag over. Past hij er niet tussen, dan kunnen we alsnog een bod doen — in dat geval wordt het voertuig doorverkocht via ons partnernetwerk, wat betekent dat de inkoopprijs iets lager ligt. Neem contact op voor een vrijblijvende taxatie.",
  },
  {
    question: "Bieden jullie garantie aan?",
    answer:
      "Ja. Wij werken samen met AutoTrust, een dochteronderneming van BOVAG. Via deze samenwerking kunnen wij officiële AutoTrust garantiepakketten aanbieden op voertuigen die daarvoor in aanmerking komen. Zo rijdt u met zekerheid weg.",
  },
  {
    question: "Doen jullie ook onderhoud en reparaties?",
    answer:
      "Ja, wij voeren onderhoud en reparaties uit. APK-keuringen voeren wij zelf niet uit, maar voor al het overige onderhoud en herstelwerk kunt u bij ons terecht.",
  },
  {
    question: "Hoe kan ik betalen?",
    answer:
      "Wij accepteren de volgende betaalmethoden: pinbetaling, contant tot €3.000, bankoverschrijving en financiering. Voor financiering werken wij samen met financiallease.nl — wij kunnen de aanvraag voor u verzorgen. Vraag ernaar tijdens uw bezoek.",
  },
  {
    question: "Moet ik een afspraak maken om langs te komen?",
    answer:
      "U bent altijd welkom tijdens onze openingstijden, zonder afspraak. Wilt u een specifieke auto bezichtigen? Dan stellen wij het op prijs als u van tevoren even laat weten dat u komt en voor welke auto — zo zorgen wij dat het voertuig aanwezig, schoongemaakt en klaar staat voor bezichtiging. Buiten openingstijden zijn wij beschikbaar op afspraak.",
  },
  {
    question: "Kunnen jullie een auto bezorgen?",
    answer:
      "Ja, bezorging is mogelijk. Wij brengen de auto naar uw gewenste locatie, zoals uw thuis- of werkadres. Hier zijn bezorgkosten aan verbonden. Neem contact op voor meer informatie en een prijsopgave.",
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
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border border-border rounded-lg px-6 bg-background"
              >
                <AccordionTrigger className="text-left text-base font-semibold font-body text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-body font-light leading-relaxed">
                  {faq.answer}
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
