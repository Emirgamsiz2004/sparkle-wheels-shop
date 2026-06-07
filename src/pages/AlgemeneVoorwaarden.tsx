import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Helmet } from "react-helmet-async";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
    <div className="space-y-2">{children}</div>
  </section>
);

const AlgemeneVoorwaarden = () => (
  <>
    <Helmet>
      <title>Algemene Voorwaarden | Platin Automotive</title>
      <meta name="description" content="Algemene voorwaarden van Platin Automotive — versie 7 juni 2026. Voor aan- en verkoop van voertuigen, consignatie, reparaties en overige diensten." />
      <link rel="canonical" href="https://platinautomotive.nl/algemene-voorwaarden" />
      <meta name="robots" content="index, follow" />
    </Helmet>
    <Navbar />
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">Algemene Voorwaarden</h1>
        <p className="text-xs text-muted-foreground mb-8">Versie 7 juni 2026 · Platin Automotive</p>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">

          <Section title="Artikel 1 — Definities">
            <p>In deze algemene voorwaarden wordt verstaan onder:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li><strong className="text-foreground">Platin Automotive:</strong> de eenmanszaak geregistreerd onder KvK-nummer 99146193, gevestigd aan de Cilinderweg 99, 2371 DZ Roelofarendsveen, hierna ook te noemen 'verkoper'.</li>
              <li><strong className="text-foreground">Koper:</strong> de natuurlijke of rechtspersoon die met Platin Automotive een overeenkomst aangaat.</li>
              <li><strong className="text-foreground">Consument:</strong> een koper die handelt buiten de uitoefening van zijn beroep of bedrijf (art. 6:230g BW).</li>
              <li><strong className="text-foreground">Voertuig:</strong> het motorvoertuig dat onderwerp is van de overeenkomst.</li>
              <li><strong className="text-foreground">Consignatie:</strong> het in bewaring geven van een voertuig aan Platin Automotive met als doel verkoop namens de eigenaar.</li>
              <li><strong className="text-foreground">Schriftelijk:</strong> communicatie per brief, e-mail of andere door partijen overeengekomen schriftelijke communicatiemiddelen.</li>
            </ol>
          </Section>

          <Section title="Artikel 2 — Toepasselijkheid">
            <ol start={7} className="list-decimal pl-5 space-y-1">
              <li>Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, koopovereenkomsten, reparaties, consignatieovereenkomsten en overige diensten van Platin Automotive.</li>
              <li>Afwijkingen van deze voorwaarden zijn alleen geldig indien schriftelijk overeengekomen en door Platin Automotive bevestigd.</li>
              <li>De toepasselijkheid van eventuele algemene voorwaarden van de koper wordt uitdrukkelijk van de hand gewezen.</li>
              <li>Indien een bepaling in deze voorwaarden nietig of vernietigbaar blijkt, tast dit de geldigheid van de overige bepalingen niet aan.</li>
            </ol>
          </Section>

          <Section title="Artikel 3 — Aanbiedingen en prijzen">
            <ol start={11} className="list-decimal pl-5 space-y-1">
              <li>Alle aanbiedingen en prijzen op de website, in advertenties en in offertes zijn vrijblijvend en onder voorbehoud van tussentijdse wijzigingen en typefouten.</li>
              <li>Een aanbieding vervalt indien het voertuig tussentijds aan een derde wordt verkocht. Platin Automotive zal de koper hiervan zo spoedig mogelijk op de hoogte stellen.</li>
              <li>De koopovereenkomst komt uitsluitend tot stand na schriftelijke bevestiging of ondertekening door beide partijen.</li>
              <li>Vermelde prijzen zijn inclusief BTW tenzij anders aangegeven. Bij toepassing van de margeregeling (art. 28 Wet OB) wordt geen BTW op de factuur vermeld.</li>
              <li>Platin Automotive behoudt het recht om een mondelinge reservering of prijsafspraak als niet bindend te beschouwen totdat de koopovereenkomst is ondertekend.</li>
            </ol>
          </Section>

          <Section title="Artikel 4 — Koopovereenkomst en eigendomsvoorbehoud">
            <ol start={16} className="list-decimal pl-5 space-y-1">
              <li>De koopovereenkomst komt tot stand na ondertekening door beide partijen of schriftelijke bevestiging door Platin Automotive.</li>
              <li>Het gekochte voertuig blijft eigendom van Platin Automotive totdat de volledige koopsom, inclusief eventuele rente en bijkomende kosten, volledig is voldaan (eigendomsvoorbehoud, art. 3:92 BW).</li>
              <li>Zolang het eigendomsvoorbehoud geldt, mag de koper het voertuig niet vervreemden, verpanden of bezwaren.</li>
              <li>Bij niet-nakoming van de betalingsverplichting is Platin Automotive gerechtigd het voertuig zonder rechterlijke tussenkomst terug te nemen. Hieraan zijn geen rechten op schadevergoeding verbonden vanwege Platin Automotive.</li>
              <li>Het voertuig wordt geleverd in de staat zoals omschreven in de koopovereenkomst en zoals de koper dit heeft kunnen inspecteren.</li>
            </ol>
          </Section>

          <Section title="Artikel 5 — Inspectie en proefrit">
            <ol start={21} className="list-decimal pl-5 space-y-1">
              <li>De koper wordt uitdrukkelijk in de gelegenheid gesteld het voertuig voor aankoop te inspecteren en een proefrit te maken.</li>
              <li>Door ondertekening van de koopovereenkomst verklaart de koper het voertuig in de aangeboden staat te hebben gezien en geaccepteerd, rekening houdend met de leeftijd en het gebruik van het voertuig.</li>
              <li>Zichtbare gebreken of door Platin Automotive meegedeelde gebreken die bij inspectie kenbaar waren, kunnen na levering niet als grond voor garantie of non-conformiteit worden ingeroepen.</li>
              <li>Platin Automotive adviseert de koper bij twijfel een onafhankelijke technische keuring te laten uitvoeren vóór aankoop. De kosten hiervan zijn voor rekening van de koper.</li>
            </ol>
          </Section>

          <Section title="Artikel 6 — Betaling">
            <ol start={25} className="list-decimal pl-5 space-y-1">
              <li>Betaling van de volledige koopsom geschiedt vóór of bij levering van het voertuig, tenzij schriftelijk anders overeengekomen.</li>
              <li>Betaling kan plaatsvinden per bankoverschrijving of contant. Bij contante betaling geldt een wettelijk maximum conform de Wet ter voorkoming van witwassen en financieren van terrorisme (Wwft). Platin Automotive is gerechtigd bij contante betalingen boven € 3.000 aanvullende identificatie te verlangen.</li>
              <li>Bij niet-tijdige betaling is de koper van rechtswege in verzuim en is hij over het openstaande bedrag de wettelijke (handels)rente verschuldigd.</li>
              <li>Platin Automotive behoudt het recht de overeenkomst te ontbinden bij uitblijven van betaling, onverminderd het recht op schadevergoeding.</li>
              <li>Eventuele incassokosten komen volledig voor rekening van de koper conform de Wet incassokosten.</li>
            </ol>
          </Section>

          <Section title="Artikel 7 — Levering en risico">
            <ol start={30} className="list-decimal pl-5 space-y-1">
              <li>Levering vindt plaats op de vestiging van Platin Automotive te Roelofarendsveen, tenzij schriftelijk anders overeengekomen.</li>
              <li>Het risico van verlies, schade of waardevermindering van het voertuig gaat over op de koper op het moment van feitelijke aflevering.</li>
              <li>De koper is verplicht vóór het ophalen van het voertuig een geldige WA-verzekering (en indien gewenst een uitgebreidere dekking) af te sluiten. Platin Automotive is niet aansprakelijk voor schade die ontstaat tijdens transport na levering.</li>
              <li>De kentekenwijziging (overschrijving) is de verantwoordelijkheid van de koper en dient te geschieden conform de wettelijke termijnen. Eventuele fiscale of verzekeringstechnische gevolgen van een te late overschrijving zijn voor rekening van de koper.</li>
              <li>Bij niet-afhalen van het voertuig na overeengekomen leverdatum is Platin Automotive gerechtigd stallingskosten in rekening te brengen van € 15,- per dag.</li>
            </ol>
          </Section>

          <Section title="Artikel 8 — Garantie">
            <ol start={35} className="list-decimal pl-5 space-y-1">
              <li>Op gebruikte voertuigen wordt geen standaard garantie verleend, tenzij dit schriftelijk in de koopovereenkomst is vastgelegd.</li>
              <li>Indien garantie is overeengekomen, geldt deze uitsluitend voor gebreken die aantoonbaar bij aflevering aanwezig waren en niet zichtbaar waren bij een normale inspectie.</li>
              <li>Slijtageonderdelen zijn uitdrukkelijk uitgesloten van garantie. Hieronder vallen onder meer: remblokken, remschijven, banden, koppelingsplaat, accu, lampen, filters, riemen, ruitenwissers en schakelaars.</li>
            </ol>
            <p className="pt-1">De garantie vervalt geheel en met onmiddellijke ingang indien:</p>
            <ol className="list-[lower-alpha] pl-5 space-y-1">
              <li>het voertuig na aflevering is onderhouden, gerepareerd of anderszins technisch behandeld door een andere partij dan Platin Automotive, tenzij koper aantoont dat de betreffende werkzaamheden het gemelde gebrek aantoonbaar niet hebben veroorzaakt of beïnvloed;</li>
              <li>het voertuig is gemodificeerd, omgebouwd of voorzien van niet-originele onderdelen zonder voorafgaande schriftelijke toestemming van Platin Automotive;</li>
              <li>het voertuig is gebruikt voor doeleinden waarvoor het niet is bestemd, waaronder deelname aan wedstrijden, rijlessen of zakelijk transport;</li>
              <li>schade is ontstaan door onoordeelkundig gebruik, nalatigheid, externe invloeden (waaronder aanrijding, storm- of waterschade), of het negeren van dashboard-waarschuwingen;</li>
              <li>het voertuig niet tijdig is voorzien van regulier onderhoud conform de fabrieksvoorschriften;</li>
              <li>de koper een gebrek niet binnen 5 werkdagen na ontdekking schriftelijk heeft gemeld bij Platin Automotive;</li>
              <li>het voertuig reeds door een derde is onderzocht of hersteld voordat Platin Automotive de gelegenheid heeft gehad het gebrek te inspecteren.</li>
            </ol>
            <ol start={38} className="list-decimal pl-5 space-y-1 pt-1">
              <li>Garantieclaims dienen schriftelijk te worden ingediend. Het voertuig dient ter inspectie te worden aangeboden bij Platin Automotive aan de Cilinderweg 99 te Roelofarendsveen.</li>
              <li>Garantie wordt naar keuze van Platin Automotive uitgevoerd door herstel of vervanging van het betreffende onderdeel. Vergoeding van gevolgschade, vervangend vervoer of andere indirecte kosten is uitgesloten.</li>
              <li>Voor consumenten geldt dat de wettelijke rechten voortvloeiend uit non-conformiteit (art. 7:17 e.v. BW) onverminderd van toepassing blijven. De koper draagt na verloop van zes maanden na aflevering de bewijslast ten aanzien van de non-conformiteit.</li>
            </ol>
          </Section>

          <Section title="Artikel 9 — APK en technische keuring">
            <ol start={41} className="list-decimal pl-5 space-y-1">
              <li>Platin Automotive garandeert dat het voertuig op het moment van levering beschikt over een geldige APK, tenzij in de koopovereenkomst uitdrukkelijk schriftelijk anders is overeengekomen.</li>
              <li>Een geldige APK is geen garantie voor de technische staat van het voertuig in zijn geheel. De koper wordt geadviseerd bij twijfel een aanvullende technische keuring te laten uitvoeren.</li>
              <li>Bij voertuigen verkocht zonder APK (expliciet vermeld in de koopovereenkomst) aanvaardt de koper het voertuig in huidige staat zonder aanspraak te kunnen maken op APK-keuring door Platin Automotive.</li>
            </ol>
          </Section>

          <Section title="Artikel 10 — Consignatie">
            <ol start={44} className="list-decimal pl-5 space-y-1">
              <li>Bij consignatieverkoop geeft de consignatiegever het voertuig in bewaring aan Platin Automotive voor de duur van de consignatieperiode, met als doel verkoop namens de eigenaar.</li>
              <li>De consignatiegever garandeert dat het voertuig vrij is van schulden, financieringen, beslagen en overige bezwaren, en dat hij gerechtigd is het voertuig ter consignatie aan te bieden.</li>
              <li>De consignatiegever is verantwoordelijk voor een geldige WA-verzekering op het voertuig gedurende de gehele consignatieperiode.</li>
              <li>Platin Automotive stelt in overleg een vraagprijs vast. Verkoop beneden de overeengekomen minimumprijs geschiedt uitsluitend na uitdrukkelijke schriftelijke toestemming van de consignatiegever.</li>
              <li>Bij verkoop ontvangt de consignatiegever de verkoopprijs minus de overeengekomen commissie. Betaling vindt plaats binnen 5 werkdagen na ontvangst van de koopsom van de koper.</li>
              <li>Platin Automotive is niet aansprakelijk voor schade aan het voertuig gedurende de consignatieperiode, tenzij deze schade aantoonbaar is veroorzaakt door opzet of grove nalatigheid van Platin Automotive.</li>
              <li>Beide partijen kunnen de consignatieovereenkomst tussentijds beëindigen met een schriftelijke opzegtermijn van 5 werkdagen. Bij tussentijdse beëindiging op verzoek van de consignatiegever zijn de werkelijk gemaakte kosten (advertentiekosten, administratie e.d.) verschuldigd.</li>
            </ol>
          </Section>

          <Section title="Artikel 11 — Reparaties en werkplaatswerkzaamheden">
            <ol start={51} className="list-decimal pl-5 space-y-1">
              <li>Op reparaties en onderhoudswerkzaamheden uitgevoerd door Platin Automotive geldt een garantietermijn van 3 maanden op de uitgevoerde arbeid en gebruikte materialen, tenzij schriftelijk anders overeengekomen.</li>
              <li>Platin Automotive brengt vóór aanvang van werkzaamheden een kostenraming uit. Overschrijding van de raming met meer dan 10% wordt vooraf gemeld aan de klant.</li>
              <li>Voertuigen die na gereedmelding niet binnen 5 werkdagen worden opgehaald, kunnen stallingskosten in rekening worden gebracht van € 15,- per dag.</li>
              <li>Platin Automotive behoudt het recht op retentie: het voertuig wordt niet teruggegeven zolang de factuur niet volledig is voldaan.</li>
            </ol>
          </Section>

          <Section title="Artikel 12 — Aanbetaling en annulering">
            <ol start={55} className="list-decimal pl-5 space-y-1">
              <li>Bij reservering van een voertuig is een aanbetaling vereist. Het bedrag wordt in onderling overleg vastgesteld en schriftelijk bevestigd door Platin Automotive.</li>
              <li>De aanbetaling wordt in mindering gebracht op de totale koopsom bij levering van het voertuig.</li>
              <li>Bij annulering van de koopovereenkomst door de koper, om welke reden dan ook, vervalt de aanbetaling als vergoeding voor gederfde verkoopkans en gemaakte kosten. De koper heeft geen recht op restitutie van de aanbetaling.</li>
              <li>Bij annulering door Platin Automotive wordt de aanbetaling volledig en zonder aftrek teruggestort aan de koper, uiterlijk binnen 5 werkdagen.</li>
              <li>Voor consumenten geldt dat bij annulering binnen de wettelijke bedenktermijn (art. 6:230o BW) de aanbetaling volledig wordt teruggestort, mits de overeenkomst op afstand is gesloten.</li>
            </ol>
          </Section>

          <Section title="Artikel 13 — Schorsing en wegenbelasting">
            <ol start={60} className="list-decimal pl-5 space-y-1">
              <li>De koper is na levering zelf verantwoordelijk voor het tijdig laten opheffen van een eventuele schorsing op het voertuig en het betalen van verschuldigde wegenbelasting.</li>
              <li>Platin Automotive is niet aansprakelijk voor naheffingen, boetes of aanslagen van de Belastingdienst of RDW die ontstaan na het moment van aflevering van het voertuig.</li>
              <li>Indien de koper nalaat het voertuig tijdig op zijn naam te laten zetten, komen alle daaruit voortvloeiende kosten, belastingen en boetes volledig voor rekening van de koper.</li>
              <li>Bij voertuigen met een lopende schorsing wordt dit uitdrukkelijk vermeld in de koopovereenkomst. De koper aanvaardt het voertuig in geschorste staat en is zelf verantwoordelijk voor opheffing en bijbehorende kosten.</li>
            </ol>
          </Section>

          <Section title="Artikel 14 — Margeregeling en BTW">
            <ol start={64} className="list-decimal pl-5 space-y-1">
              <li>De meeste door Platin Automotive verkochte voertuigen vallen onder de margeregeling (art. 28 Wet op de Omzetbelasting 1968). Bij toepassing van de margeregeling wordt geen BTW afzonderlijk op de factuur vermeld en kan de koper geen BTW terugvorderen.</li>
              <li>Of een voertuig onder de margeregeling of het normale BTW-regime valt, wordt vermeld in de koopovereenkomst. Zakelijke kopers dienen hier vooraf naar te informeren indien dit voor hen fiscaal relevant is.</li>
              <li>Platin Automotive is niet aansprakelijk voor fiscale gevolgen aan de zijde van de koper die voortvloeien uit de toegepaste BTW-behandeling, indien dit vooraf kenbaar was uit de koopovereenkomst of factuur.</li>
            </ol>
          </Section>

          <Section title="Artikel 15 — Inruil">
            <ol start={67} className="list-decimal pl-5 space-y-1">
              <li>Indien partijen een inruilvoertuig overeenkomen, wordt de inruilprijs vastgesteld op basis van de door de koper opgegeven informatie (kilometerstand, staat, geschiedenis) en een visuele inspectie door Platin Automotive.</li>
              <li>De koper garandeert dat de opgegeven kilometerstand correct is en dat het inruilvoertuig vrij is van financieringen, beslagen, schulden en overige bezwaren. Bij onjuiste opgave heeft Platin Automotive het recht de inruilprijs te herzien of de overeenkomst te ontbinden.</li>
              <li>De definitieve inruilprijs kan worden aangepast indien na nader onderzoek blijkt dat de werkelijke staat of kilometerstand afwijkt van hetgeen is opgegeven door de koper.</li>
              <li>Het risico van het inruilvoertuig gaat over op Platin Automotive op het moment van feitelijke overdracht. Tot dat moment blijft de koper verantwoordelijk voor verzekering en schade aan het inruilvoertuig.</li>
              <li>Eventuele openstaande financiering op het inruilvoertuig dient door de koper te worden afgelost vóór of bij overdracht, tenzij schriftelijk anders overeengekomen.</li>
            </ol>
          </Section>

          <Section title="Artikel 16 — Aansprakelijkheid">
            <ol start={72} className="list-decimal pl-5 space-y-1">
              <li>Platin Automotive is niet aansprakelijk voor schade die na aflevering ontstaat door gebruik, slijtage, onbekende gebreken of externe oorzaken.</li>
              <li>De aansprakelijkheid van Platin Automotive is in alle gevallen beperkt tot het factuurbedrag van het betreffende voertuig of de betreffende dienst.</li>
              <li>Platin Automotive is nimmer aansprakelijk voor gevolgschade, gederfde winst, reiskosten, vervangende transportkosten of andere indirecte schade.</li>
              <li>Platin Automotive is niet aansprakelijk voor schade ontstaan door onjuiste of onvolledige informatie verstrekt door de koper of consignatiegever.</li>
              <li>Voor consumenten geldt dat de beperking van aansprakelijkheid niet van toepassing is op schade veroorzaakt door opzet of bewuste roekeloosheid van Platin Automotive.</li>
            </ol>
          </Section>

          <Section title="Artikel 17 — Herroepingsrecht">
            <ol start={77} className="list-decimal pl-5 space-y-1">
              <li>Bij verkoop op afstand (online of telefonisch gesloten overeenkomsten) heeft een consument het recht de overeenkomst binnen 14 dagen zonder opgave van redenen te ontbinden, conform art. 6:230o BW.</li>
              <li>Het herroepingsrecht is niet van toepassing op voertuigen die op verzoek van de koper zijn ingericht of aangepast, of waarbij de overeenkomst op de vestiging van Platin Automotive is gesloten na persoonlijke bezichtiging.</li>
              <li>Bij zakelijke kopers (B2B) is het herroepingsrecht uitdrukkelijk uitgesloten.</li>
            </ol>
          </Section>

          <Section title="Artikel 18 — Klachten">
            <ol start={80} className="list-decimal pl-5 space-y-1">
              <li>Klachten over de geleverde voertuigen of diensten dienen binnen 5 werkdagen na ontdekking schriftelijk (per e-mail of aangetekende brief) te worden gemeld bij Platin Automotive.</li>
              <li>Platin Automotive streeft ernaar klachten binnen 14 kalenderdagen inhoudelijk te behandelen. Bij complexe klachten wordt de koper binnen 14 dagen geïnformeerd over de verwachte behandeltermijn.</li>
              <li>Het indienen van een klacht schort de betalingsverplichting van de koper niet op.</li>
              <li>Indien een klacht niet naar tevredenheid wordt opgelost, kan de consument zich wenden tot de bevoegde rechter of een erkende geschillencommissie.</li>
            </ol>
          </Section>

          <Section title="Artikel 19 — Persoonsgegevens">
            <ol start={84} className="list-decimal pl-5 space-y-1">
              <li>Platin Automotive verwerkt persoonsgegevens van klanten conform de Algemene Verordening Gegevensbescherming (AVG) en de toepasselijke nationale wetgeving.</li>
              <li>Gegevens worden uitsluitend verwerkt voor de uitvoering van de overeenkomst, wettelijke verplichtingen (waaronder fiscale) en eventuele incasso- of geschillenbeslechting.</li>
              <li>Platin Automotive verkoopt of verhuurt geen persoonsgegevens aan derden. Gegevens worden alleen gedeeld met partijen die direct betrokken zijn bij de uitvoering van de overeenkomst.</li>
              <li>De koper heeft te allen tijde het recht op inzage, correctie of verwijdering van zijn persoonsgegevens. Hiervoor kan contact worden opgenomen via <a href="mailto:info@platinautomotive.nl" className="text-primary hover:underline">info@platinautomotive.nl</a>.</li>
            </ol>
          </Section>

          <Section title="Artikel 20 — Toepasselijk recht en geschillen">
            <ol start={88} className="list-decimal pl-5 space-y-1">
              <li>Op alle overeenkomsten en geschillen is uitsluitend Nederlands recht van toepassing.</li>
              <li>Geschillen worden in eerste instantie voorgelegd aan de bevoegde rechter in het arrondissement Den Haag.</li>
              <li>Partijen zullen eerst trachten een geschil in onderling overleg op te lossen voordat zij een beroep doen op de rechter.</li>
            </ol>
          </Section>

          <Section title="Artikel 21 — Wijzigingen">
            <ol start={91} className="list-decimal pl-5 space-y-1">
              <li>Platin Automotive behoudt het recht deze algemene voorwaarden te wijzigen. De meest recente versie is te vinden op de website van Platin Automotive en is op verzoek kosteloos verkrijgbaar.</li>
              <li>Wijzigingen zijn van toepassing op alle na de datum van wijziging gesloten overeenkomsten.</li>
            </ol>
          </Section>

          <Section title="Artikel 22 — Contactgegevens">
            <p>
              Platin Automotive<br />
              Cilinderweg 99, 2371 DZ Roelofarendsveen<br />
              KvK: 99146193<br />
              E-mail: <a href="mailto:info@platinautomotive.nl" className="text-primary hover:underline">info@platinautomotive.nl</a><br />
              Telefoon: 071-781 25 25
            </p>
          </Section>
        </div>
      </div>
    </main>
    <Footer />
  </>
);

export default AlgemeneVoorwaarden;
