# AstraShop Training Lab

> Applicazione deliberatamente vulnerabile, **solo per il workshop Blind Trust**. Tutti i dati, gli utenti, i token e i comportamenti sono fittizi e confinati al laboratorio.

## Avvio rapido

### Diretto con Node 22+

```bash
npm start
```

Il server ascolta su `127.0.0.1:3000` per default. Aprire `http://localhost:3000`.

### Con Docker Compose

```bash
docker compose up --build
```

Il compose dichiara una rete interna, pubblica la porta solo su `127.0.0.1` e l'app non effettua chiamate di rete in uscita.

## Identità demo

| ID | Nome | Ruolo | Tenant |
|---|---|---|---|
| `demo-alice` | Alice Rossi | Sales lead | `northstar` |
| `demo-bruno` | Bruno Conti | Customer success | `lumen` |
| `demo-ops` | Ops Team | Platform observer | `internal` |

L'interfaccia invia l'identità scelta nel solo header didattico `X-Demo-User`. Non è un modello di autenticazione da utilizzare in produzione.

## Challenge incluse

| Flag | Tema | Punto di ingresso |
|---|---|---|
| FLAG_1 | Dipendenza non verificata / slopsquatting simulato | `package.json`, `training/registry-metadata.json`, `packages/` |
| FLAG_2 | Sanitizzazione aggirabile | Ticket, preview report, `src/middleware/`, `src/services/` |
| FLAG_3 | Segreto nel contesto | `docs/llm-development-notes.md`, `data/debug.log`, history Git |
| FLAG_4 | Authorization incompleta | Bozze d'ordine e `GET /api/orders/:id/draft` |
| FLAG_5 | Pipeline insufficiente | `.github/workflows/ci.yml` |

## Comandi utili

```bash
npm test                 # test baseline
npm run verify           # controlli locali del lab
npm run simulate:package # scrive solo una riga in data/telemetry.log
npm run reset            # resetta la telemetria locale
```

Per resettare anche lo stato in memoria mentre il server è attivo, usare il pulsante **Reset completo** nella UI oppure inviare `POST /api/lab/reset` al solo host locale.

## Regole di ingaggio

1. Operare esclusivamente nell'ambiente AstraShop assegnato.
2. Non introdurre segreti, configurazioni, account o record reali.
3. Fermarsi alla PoC minima e innocua richiesta dalla missione.
4. Non eseguire scansioni né chiamate verso sistemi esterni.
5. Dopo il finding, concentrarsi su patch, test e prevenzione.

## Note per facilitatori

Le direzioni di remediation sono in [`docs/safe-patch-guide.md`](docs/safe-patch-guide.md). Consegnare questa guida nel debrief o come hint finale, non nell'apertura della challenge.
