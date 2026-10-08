# Expected findings — facilitatori

| Flag | Evidenza minima | Patch/test atteso |
|---|---|---|
| FLAG_1 | Pacchetto fuori catalogo, owner e repository assenti, metadata incoerente | Rimozione/sostituzione; policy registry e lockfile |
| FLAG_2 | `sanitizeNote()` è una blacklist; `innerHTML` riceve `noteHtml` | rendering testuale/escaping; test di regressione |
| FLAG_3 | Valore `TRAINING_ONLY_` in note/log/history | incidente simulato: rotazione, contenimento, clean-up, scan |
| FLAG_4 | Route ordine filtra solo per ID, non tenant/owner | query vincolata a tenant/owner; test cross-user |
| FLAG_5 | CI non effettua secret scan, SAST, SCA, policy dipendenze o SBOM | gate, eccezioni con scadenza, ownership |

> Non sono richieste tecniche di exploit, esfiltrazione o accesso a sistemi esterni. La prova minima è parte della valutazione.
