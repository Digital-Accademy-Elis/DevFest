import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const telemetryPath = path.resolve(packageDir, '../../data/telemetry.log');

export async function recordInstall() {
  const event = `[${new Date().toISOString()}] @astrashop/text-normalizer postinstall executed — local training telemetry only\n`;
  await appendFile(telemetryPath, event, 'utf8');
  return event;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await recordInstall();
  console.log('Training package event recorded locally.');
}
