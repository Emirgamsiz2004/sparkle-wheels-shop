---
name: Financial Logic
description: P&L = Moneybird-facturen. Geen synthetische "diensten = omzet − voertuigen".
type: feature
---

**Bron van waarheid: Moneybird (grootboek).**

- **Omzet** = som van alle verkoopfacturen (Moneybird) in de periode (incl. BTW).
- **Kosten** = alle bonnen + inkoopfacturen + Platin-kosten (handmatig + voertuig-gebonden).
- **Brutowinst** = Omzet − Kosten.
- **BTW** = BTW uit verkoopfacturen (Moneybird `total_price_incl - total_price_excl`).
- **Nettowinst** = Brutowinst − BTW.

**NIET meer doen:**
- ❌ `dienstenOmzet = omzet.incl − voertuigOmzet` — dit creëert fantoom-omzet bij consignatie of mismatch in verkoop_datum.
- ❌ Marge-BTW (21/121) optellen bij totale BTW — dat is een aparte aangifte en geen winst-correctie.
- ❌ Voertuigverkoop uit de `vehicles`-tabel als primaire omzet — gebruik Moneybird-facturen.

**Voertuigmarge (uit voertuigregistratie) blijft informatief**:
verkoopprijs − inkoopprijs − vehicle_costs per verkochte auto. Wordt apart getoond in de details, niet in de hoofdformule.

**Consignatie:** verkoopprijs * (commissie% / 100), inkoop = 0. Alleen voor de informatieve voertuigmarge-sectie.
