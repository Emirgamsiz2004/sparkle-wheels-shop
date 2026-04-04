## Verkoop & Reservering Wizard

### Stap 1: Database voorbereiden
- Nieuwe tabel `vehicle_sales` voor verkoopdata (klantgegevens, betaalwijze, garantie, aanbetaling, status per stap)
- Wizard-state opslaan zodat heropenen mogelijk is

### Stap 2: Wizard component bouwen
- `VerkoopWizard.tsx` — 5-staps wizard met voortgangsbalk
- State persistence in localStorage voor wizard-herstel
- Stap 1: Klantgegevens formulier + bestaande klant check
- Stap 2: Verkoopdetails (prijs, betaalwijze, Wwft, aanbetaling, garantie)
- Stap 3: Koopovereenkomst PDF genereren + printen
- Stap 4: Factuur via Moneybird API
- Stap 5: Afronden + voertuig markeren als verkocht

### Stap 3: Reservering flow
- `ReserveringWizard.tsx` — 2-staps wizard
- Aanbetalingsbevestiging PDF genereren
- Status "Gereserveerd" met klantinfo
- "Verkoop afronden" knop die verkoopwizard start bij stap 2

### Stap 4: PDF generatie
- Koopovereenkomst PDF in Platin Automotive huisstijl (jsPDF)
- Aanbetalingsbevestiging PDF
- Print-functionaliteit

### Stap 5: Integratie
- VerkoopDialog vervangen door wizard
- Reserveren optie toevoegen aan Meer dropdown
- "Verkoop afronden" knop bij gereserveerde voertuigen
- Klant automatisch opslaan in customers tabel
- Dashboard marge/omzet update

### Stap 6: Moneybird factuur
- Bestaande Moneybird hook gebruiken voor factuur aanmaak
- Factuurpreview in wizard stap 4
