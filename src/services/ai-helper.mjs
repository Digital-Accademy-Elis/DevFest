import { appendFile } from 'node:fs/promises';

export const suggestedPackage = '@astrashop/text-normalizer';

export async function simulateSuggestedPackage({ telemetryPath, actor }) {
  const event = `[${new Date().toISOString()}] ${suggestedPackage} imported by ${actor} — local training telemetry only\n`;
  await appendFile(telemetryPath, event, 'utf8');
  return { package: suggestedPackage, message: 'Evento scritto solo nel log locale del laboratorio.' };
}
