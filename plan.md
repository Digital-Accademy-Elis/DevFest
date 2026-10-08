# Piano di implementazione — AstraShop Training Lab

## Scopo

AstraShop Training Lab è l'applicazione web deliberatamente vulnerabile, ma confinata, su cui si basa il workshop **Blind Trust: Caccia alle Vulnerabilità nel Codice Generato da IA**. Riproduce una piccola piattaforma B2B per ticket, report e bozze d'ordine; tutti i dati, gli utenti e i segreti sono fittizi e non riutilizzabili.

L'app serve a tre scopi complementari:

1. rendere osservabili cinque classi di rischio nel solo contesto del laboratorio;
2. far analizzare ai partecipanti il repository, non solo l'interfaccia;
3. raccogliere evidenze e proposte di correzione prima di un reset completo dello stato.

## Decisioni di implementazione

### Server e frontend

- **Node.js 22 senza dipendenze di runtime**: un server HTTP ESM usa esclusivamente moduli standard di Node. In questo modo il lab funziona anche senza scaricare pacchetti durante la sessione.
- **Frontend statico**: HTML, CSS e JavaScript serviti dallo stesso processo. Le richieste API usano solo URL relative e non ci sono integrazioni esterne.
- **Stato in memoria e dati seed**: ticket, ordini, note e finding vengono caricati da file JSON fittizi. Il reset ripristina lo stato seed senza dipendere da un database condiviso.
- **API minima e leggibile**: endpoint JSON per sessione demo, ticket, report, ordini, finding e reset. Il codice è intenzionalmente semplice perché la review è parte dell'esercizio.
- **Docker opzionale**: `Dockerfile` e `docker-compose.yml` permettono esecuzione effimera con una rete interna dichiarata. Lo stesso progetto funziona direttamente con `npm start`.

### Challenge deliberatamente controllate

| Flag | Artefatto didattico | Contenimento |
|---|---|---|
| Dipendenza non verificata | Pacchetto locale fittizio `@astrashop/text-normalizer`, metadati sospetti e script di telemetria locale | Nessuna registry pubblica; lo script scrive solo in `data/telemetry.log` |
| Sanitizzazione aggirabile | `sanitizeNote()` superficiale e preview HTML interna che rende una nota | CSP senza script inline; la PoC prevista è solo markup innocuo visibile |
| Segreto nel contesto | Stringa `TRAINING_ONLY_` in note, fixture, log e cronologia Git | Valore esca non valido fuori dal repository |
| Authorization incompleta | Route bozza d'ordine con identità demo, ma query basata solo su ID | Solo record seed di due utenti demo |
| Pipeline insufficiente | Workflow CI che esegue sintassi e test minimi, senza secret scan/SAST/SCA | File di esempio, nessuna pubblicazione né integrazione esterna |

### Comportamento atteso dell'interfaccia

- Selettore persistente di utente demo (`demo-alice`, `demo-bruno`, `demo-ops`) inviato con un header didattico al server.
- Dashboard con stato del lab, indicatori per le cinque flag e accesso rapido ai flussi vulnerabili.
- Pagine/viste per ticket e preview report, bozze d'ordine e repository explorer.
- Pannello finding che consente di salvare categoria, severità, evidenza, remediation e owner solo nello stato in memoria.
- Pulsante reset con conferma reversibile che cancella finding e note aggiunte, poi ricarica il seed.
- Modalità “safe patch” esclusivamente informativa: mostra punti da correggere e test da aggiungere, senza nascondere il codice vulnerabile.

## Direzione di design

### Movimento di design

**Cobalt command console**: un'interfaccia AppSec contemporanea, leggibile come una console operativa e non come un finto “hacker screen”. La direzione riprende il rigore di strumenti per sviluppatori moderni, con priorità a evidenza, tracciabilità e controllo.

### Principi

1. **Evidenza prima della decorazione**: finding, flussi e sorgenti sono sempre più visibili delle superfici ornamentali.
2. **Contrasto semantico**: ciano per percorsi sicuri e azioni pratiche; rosa per condizioni vulnerabili o non risolte.
3. **Gerarchia da postazione operativa**: navigazione laterale compatta, spazio di analisi dominante, pannelli contestuali.
4. **Trasparenza didattica**: etichette che dichiarano esplicitamente dati fittizi e scope del laboratorio.

### Colore

- `#0B132B` blu notte: superficie operativa e senso di contenimento.
- `#1C2541` blu ardesia: pannelli e frame di codice.
- `#00E5FF` ciano elettrico: verifiche, percorsi e call to action.
- `#FF3366` rosa acceso: flag, rischi e assunzioni non verificate.
- `#F0F4F8` testo principale e `#8D99AE` testo secondario: contrasto elevato.

### Layout e firma visiva

Il layout usa una **shell asimmetrica**: una barra laterale fissa con i moduli del lab e un'area principale a colonne variabili. I contenuti non sono centrati in una griglia marketing: ogni vista guida da contesto → evidenza → azione.

Elementi distintivi:

- micro-etichetta monospazio `[LAB_SCOPE: LOCAL_ONLY]`;
- linee di connessione sottili e nodi ciano per i flussi;
- badge `FLAG_1…FLAG_5` e blocchi “evidence card”.

### Interazioni e animazioni

Le interazioni privilegiano l'azione immediata: selezionare un utente demo aggiorna il contesto; aprire una risorsa mostra la relativa evidenza; salvare un finding aggiorna la bacheca. Le transizioni sono brevi, rispettano `prefers-reduced-motion` e non simulano attacchi o terminali.

### Tipografia, identità e voce

- Titoli: **Space Grotesk**; testo: **Inter**; metadati e codice: **IBM Plex Mono** con fallback di sistema.
- Wordmark: monogramma geometrico “A//” seguito da `AstraShop` e dal tag `TRAINING LAB`.
- Colore distintivo: ciano `#00E5FF`.
- Essenza: “un banco prova AppSec per imparare a verificare il codice assistito da IA”.
- Personalità: precisa, calma, formativa.
- Microcopy: “Raccogli prove, non supposizioni.” / “Questa azione modifica solo lo stato fittizio del laboratorio.”

## Struttura del progetto

```text
astrashop/
├── server.mjs                    # Server HTTP, API e static-file serving
├── package.json                  # Script senza dipendenze di runtime
├── Dockerfile                    # Runtime Node effimero
├── docker-compose.yml            # Avvio locale isolato
├── public/
│   ├── index.html                # Shell accessibile dell'app
│   ├── styles.css                # Tema Cobalto e layout responsivo
│   ├── app.js                    # Routing client, fetch API, UI interattiva
│   └── manus-routes.json         # Manifest route richiesto da Preview
├── data/
│   ├── seed.json                 # Utenti, ticket, ordini e report fittizi
│   ├── debug.log                 # Indizio per secret scanning, solo fittizio
│   └── telemetry.log             # Traccia locale della simulazione package
├── src/
│   ├── middleware/sanitize.mjs   # Sanitizzazione intenzionalmente insufficiente
│   ├── services/report-renderer.mjs # Rendering preview deliberatamente non sicuro
│   └── services/ai-helper.mjs    # Nota didattica sul package suggerito
├── packages/acme-text-normalizer/
│   ├── package.json              # Metadati della dipendenza simulata
│   └── postinstall.mjs           # Telemetria locale innocua
├── docs/
│   ├── llm-development-notes.md  # Indizi contestuali e segreto esca
│   ├── architecture.md           # Mappa app e confini
│   └── safe-patch-guide.md       # Correzioni attese, per facilitatori
├── training/
│   ├── flags.md                  # Brief delle challenge
│   ├── registry-metadata.json    # Metadati registry locale fittizia
│   └── finding-template.md       # Template consegna team
├── tests/health.test.mjs         # Test baseline non sufficiente
├── scripts/
│   ├── reset-lab.sh              # Reset idempotente
│   ├── verify-lab.sh             # Health check e controllo artefatti
│   └── simulate-package-install.mjs # PoC supply-chain innocua
└── .github/workflows/ci.yml      # Pipeline didatticamente insufficiente
```

## Confini espliciti

- Nessuna chiamata di rete in uscita dal codice applicativo.
- Nessuna chiave, password, account o record reale.
- Nessuna PoC oltre una modifica visibile e innocua dell'HTML nel lab.
- Nessun endpoint esterno, scanner automatizzato o raccolta telemetrica remota.
- La sicurezza “corretta” resta documentata in `docs/safe-patch-guide.md`; il lab non deve diventare un modello da copiare in produzione.
