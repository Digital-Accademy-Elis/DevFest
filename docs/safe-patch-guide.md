# Guida facilitatori — direzioni di patch sicure

> Non mostrare questa guida ai partecipanti prima del debrief, salvo quando è previsto l'hint finale.

## Flag 1 — Dipendenza suggerita

- Rimuovere la dipendenza non verificata o sostituirla con libreria standard/componente approvato.
- Consentire soltanto registry e scope approvati.
- Richiedere lockfile, owner/repository, review dedicata, SBOM e SCA.

## Flag 2 — Preview report

- Trattare la nota come testo per default: `textContent`, template auto-escaping o encoding contestuale.
- Validare tipo, lunghezza e semantica dell'input.
- Se HTML è realmente necessario, usare allowlist e sanitizzazione robusta nel punto appropriato.
- Aggiungere test che fallisce con markup di test e passa quando il valore viene reso come testo.

## Flag 3 — Segreti nel contesto

- Ruotare/revocare immediatamente ogni segreto reale esposto.
- Rimuovere da file, log, issue, artifact, prompt e cronologia Git con una procedura approvata.
- Aggiungere secret scanning pre-commit e server-side.

## Flag 4 — Ownership

- Filtrare in query/service layer per identificativo, tenant e owner autorizzato.
- Aggiungere test cross-user e cross-tenant con caso negato.

## Flag 5 — CI

- Mantenere test e sintassi come baseline.
- Aggiungere secret scan, SAST, SCA, review delle dipendenze e SBOM per release.
- Definire blocchi, eccezioni con owner/scadenza e gestione dei falsi positivi.
