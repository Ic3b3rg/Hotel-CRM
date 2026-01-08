# TODO - HotelCRM Desktop

## 🐛 Bug

### [BUG-001] Modifica venditore immobile non funzionante
- **Descrizione:** Quando si cambia il venditore di un immobile, l'azione non va a buon fine senza messaggi di errore
- **File coinvolti:** `properties.repository.ts`, `PropertyForm.tsx`
- **Priorità:** Alta

---

## 🏠 Immobili (Properties)

### [PROP-001] Formattazione campi EUR con separatore migliaia
- **Descrizione:** I campi prezzo devono mostrare il separatore delle migliaia (1.000, 10.000, 1.650.000)
- **Campi interessati:** Tutti i campi con label "EUR"
- **Note tecniche:** Implementare input mask o formatter per numeri

### [PROP-002] Campo "Codice Immobile"
- **Descrizione:** Aggiungere campo di testo per il codice identificativo dell'immobile
- **Tipo:** `string`
- **Migrazione DB:** Aggiungere colonna `codice` alla tabella `properties`

### [PROP-003] Gestione Incarico
- **Descrizione:** Aggiungere sezione incarico con:
  - Checkbox "Incarico" (sì/no)
  - Campo percentuale/provvigione (%) - visibile se incarico = sì
  - Campo data scadenza incarico - visibile se incarico = sì
- **Migrazione DB:** Aggiungere colonne `has_incarico`, `incarico_percentuale`, `incarico_scadenza`

### [PROP-004] Campo Regione
- **Descrizione:** Aggiungere campo select "Regione" al form immobile
- **Tipo:** Select con le 20 regioni italiane
- **Migrazione DB:** Aggiungere colonna `regione`

### [PROP-005] Tipo Operazione (multi-selezione)
- **Descrizione:** Aggiungere campo multi-select per tipo operazione
- **Opzioni:**
  - Affitto attività
  - Vendita attività
  - Affitto mura
  - Vendita mura
  - Vendita cespite
  - Vendita società
- **Note:** Non esclusivi, possono essere selezionati più tipi
- **Migrazione DB:** Tabella many-to-many `property_operation_types` o campo JSON

### [PROP-006] Upload file allegati
- **Descrizione:** Possibilità di caricare file allegati all'immobile
- **Estensioni supportate:** Excel (.xlsx, .xls), PDF (.pdf)
- **Funzionalità:** Caricamento, visualizzazione, download
- **Note tecniche:** Salvare come BLOB nel DB o in cartella dedicata con riferimento

---

## 🤝 Trattative (Deals)

### [DEAL-001] Campo Oggetto Trattativa
- **Descrizione:** Aggiungere campo select obbligatorio per l'oggetto della trattativa
- **Opzioni:**
  - Vendita
  - Affitto
  - Gestione
- **Migrazione DB:** Aggiungere colonna `oggetto` (enum)

### [DEAL-002] Campo Prezzo Richiesto
- **Descrizione:** Aggiungere campo numerico per il prezzo richiesto
- **Tipo:** `number` (EUR)
- **Migrazione DB:** Aggiungere colonna `prezzo_richiesto`

### [DEAL-003] Gestione Provvigioni
- **Descrizione:** Aggiungere sezione provvigioni con campi separati per compratore e venditore
- **Campi per ogni parte (compratore/venditore):**
  - Percentuale provvigione (float, es: 1,5%)
  - Nome collaboratore (campo testo per chi ha aiutato)
- **Migrazione DB:** Aggiungere colonne:
  - `provvigione_compratore` (REAL)
  - `collaboratore_compratore` (TEXT)
  - `provvigione_venditore` (REAL)
  - `collaboratore_venditore` (TEXT)

### [DEAL-004] Stato Pagamenti
- **Descrizione:** Aggiungere tracciamento pagamenti per compratore e venditore
- **Campi per ogni parte:**
  - Pagato: Sì / No / Rateale (select a 3 opzioni)
  - Acconto: Sì / No (checkbox)
- **Migrazione DB:** Aggiungere colonne:
  - `pagamento_compratore` (enum: 'si', 'no', 'rateale')
  - `acconto_compratore` (BOOLEAN)
  - `pagamento_venditore` (enum: 'si', 'no', 'rateale')
  - `acconto_venditore` (BOOLEAN)

---

## 📊 Dashboard

### [DASH-001] Widget Scadenze Incarichi
- **Descrizione:** Mostrare lista incarichi ordinati per scadenza più vicina
- **Visualizzazione:**
  - Nome immobile + codice
  - Giorni alla scadenza (es: "155 giorni", "-3 giorni" per scaduti)
  - Colore: verde (>30gg), giallo (15-30gg), arancione (1-14gg), rosso (scaduto)
- **Dipendenze:** Richiede implementazione [PROP-003]

---

## 🔍 Filtri e Ricerca

### [FILT-001] Filtri avanzati vista Immobili
- **Nuovi filtri da aggiungere:**
  - Filtro per Tag (multi-select)
  - Filtro per Regione (select)
  - Filtro per Tipo Operazione (multi-select)
- **Dipendenze:** Richiede [PROP-004] e [PROP-005]

---

## 📋 Ordine di Implementazione Suggerito

### Fase 1 - Bug Fix e Base
1. [BUG-001] Fix modifica venditore
2. [PROP-001] Formattazione EUR

### Fase 2 - Nuovi Campi Immobili
3. [PROP-002] Codice immobile
4. [PROP-004] Campo regione
5. [PROP-005] Tipo operazione

### Fase 3 - Gestione Incarichi
6. [PROP-003] Gestione incarico
7. [DASH-001] Widget scadenze

### Fase 4 - Trattative
8. [DEAL-001] Oggetto trattativa
9. [DEAL-002] Prezzo richiesto
10. [DEAL-003] Provvigioni
11. [DEAL-004] Stato pagamenti

### Fase 5 - Filtri e File
12. [FILT-001] Filtri avanzati
13. [PROP-006] Upload file allegati
