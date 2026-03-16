import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Helmet } from "react-helmet-async";

const CookiePolicy = () => (
  <>
    <Helmet>
      <title>Cookiebeleid | Platin Automotive</title>
      <meta name="description" content="Lees het cookiebeleid van Platin Automotive. Wij gebruiken cookies om uw ervaring op onze website te verbeteren." />
    </Helmet>
    <Navbar />
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8">Cookiebeleid</h1>
        <p className="text-xs text-muted-foreground mb-8">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Wat zijn cookies?</h2>
            <p>Cookies zijn kleine tekstbestanden die op uw apparaat worden opgeslagen wanneer u onze website bezoekt. Ze helpen ons de website goed te laten functioneren en uw ervaring te verbeteren.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Welke cookies gebruiken wij?</h2>

            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-secondary">
                    <th className="px-4 py-3 font-medium text-foreground">Type</th>
                    <th className="px-4 py-3 font-medium text-foreground">Doel</th>
                    <th className="px-4 py-3 font-medium text-foreground">Bewaartermijn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Noodzakelijk</td>
                    <td className="px-4 py-3">Essentieel voor de werking van de website, zoals sessiebeheer en beveiligingsfuncties.</td>
                    <td className="px-4 py-3">Sessie</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Functioneel</td>
                    <td className="px-4 py-3">Onthouden uw voorkeuren, zoals cookie-instellingen.</td>
                    <td className="px-4 py-3">1 jaar</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-foreground">Analytisch</td>
                    <td className="px-4 py-3">Helpen ons het websitegebruik te begrijpen en te verbeteren (bijv. Google Analytics).</td>
                    <td className="px-4 py-3">2 jaar</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Toestemming</h2>
            <p>Bij uw eerste bezoek aan onze website vragen wij uw toestemming voor het plaatsen van niet-essentiële cookies. U kunt uw keuze op elk moment aanpassen door uw browserinstellingen te wijzigen of uw cookies te verwijderen.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Cookies beheren</h2>
            <p>U kunt cookies blokkeren of verwijderen via uw browserinstellingen. Houd er rekening mee dat het blokkeren van bepaalde cookies de functionaliteit van de website kan beïnvloeden.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/nl/kb/cookies-verwijderen" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/nl-nl/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/nl-nl/microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Cookies van derden</h2>
            <p>Onze website kan cookies bevatten van derde partijen, zoals Google Analytics. Deze partijen hebben hun eigen privacybeleid. Wij hebben geen controle over de cookies die door derden worden geplaatst.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Contact</h2>
            <p>Heeft u vragen over ons cookiebeleid? Neem dan contact op via <a href="mailto:info@platinautomotive.nl" className="text-primary hover:underline">info@platinautomotive.nl</a>.</p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </>
);

export default CookiePolicy;
