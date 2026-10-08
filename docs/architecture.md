# Architettura AstraShop Training

```text
Browser dei partecipanti
        │  richieste relative + header X-Demo-User
        ▼
Node HTTP server (server.mjs)
  ├─ API ticket / report preview
  ├─ API ordini demo
  ├─ Repository explorer selettivo
  ├─ Finding board in memoria
  └─ Reset allo stato seed
        │
        ├─ data/seed.json
        ├─ data/debug.log e telemetry.log
        └─ artefatti training/ e packages/
```

## Confini

- Il server non effettua richieste HTTP in uscita e, nell'avvio diretto, ascolta su `127.0.0.1` per default. Il container ascolta internamente su tutte le interfacce, ma Compose pubblica la porta solo su `127.0.0.1` dell'host.
- Il browser usa esclusivamente URL relative allo stesso host; non sono caricate risorse remote.
- Ogni endpoint operativo richiede un'identità demo valida. La coda ticket è leggibile come coda condivisa, mentre le note sono scrivibili solo dall'owner o da `demo-ops`.
- I dati appartengono a utenti demo e non sono persistiti oltre il reset. Il reset API richiede sia un'identità demo sia l'header dedicato `X-Lab-Action: reset`.
- Il report preview ha una CSP che blocca script inline e connessioni a origini esterne. La challenge accetta solo markup innocuo visibile; l'embedding è ristretto al contesto stesso e al Preview Manus.

## Endpoint principali

| Endpoint | Uso | Nota didattica |
|---|---|---|
| `GET /api/tickets` | elenco ticket fittizi | input handling |
| `POST /api/tickets/:id/note` | aggiunge nota nel seed runtime | sanitizzazione insufficiente |
| `GET /api/reports/:id?preview=true` | preview HTML interna | sink intenzionale |
| `GET /api/orders/:id/draft` | legge bozza per ID | ownership non verificata |
| `POST /api/training/simulate-package` | telemetria locale | supply chain |
| `POST /api/lab/reset` | reset idempotente | ripetibilità |
