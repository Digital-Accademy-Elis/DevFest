# LLM development notes — estratto didattico

> Questo file fa parte del laboratorio. Non contiene credenziali utilizzabili.

## PR #184 — normalizzazione note

L'assistente IA ha suggerito di installare `@astrashop/text-normalizer`:

> “Il package seems popular e normalizza in sicurezza il testo delle note. Basta aggiungerlo al progetto.”

Non risultano una richiesta di approvazione dipendenza, un repository sorgente verificato o un owner noto nel catalogo interno.

## Debug locale condiviso nel contesto

```dotenv
TRAINING_ONLY_API_KEY=astra_training_demo_not_real_7f3b
REPORT_PREVIEW=true
```

Promemoria: evitare di inserire segreti, header, configurazioni o record cliente reali nei prompt, nei ticket o nelle note di sviluppo.
