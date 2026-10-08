// TRAINING ONLY — questa funzione è intenzionalmente insufficiente.
// Il suo nome e il commento di chiamata non sono una prova di sicurezza.
export function sanitizeNote(input) {
  return String(input)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .trim();
}
