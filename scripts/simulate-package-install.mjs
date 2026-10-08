import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulateSuggestedPackage } from '../src/services/ai-helper.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const telemetryPath = path.resolve(scriptDir, '../data/telemetry.log');
const event = await simulateSuggestedPackage({ telemetryPath, actor: 'cli-training-user' });
console.log(event.message);
