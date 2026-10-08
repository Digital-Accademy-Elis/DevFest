import { createServer as createHttpServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sanitizeNote } from './src/middleware/sanitize.mjs';
import { renderReport } from './src/services/report-renderer.mjs';
import { simulateSuggestedPackage } from './src/services/ai-helper.mjs';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(moduleDir, 'public');
const dataDir = path.join(moduleDir, 'data');
const seedPath = path.join(dataDir, 'seed.json');
const telemetryPath = path.join(dataDir, 'telemetry.log');

const repositoryFiles = [
  { path: 'package.json', label: 'Dipendenze del progetto', flag: 'FLAG_1' },
  { path: 'training/registry-metadata.json', label: 'Metadati della registry locale', flag: 'FLAG_1' },
  { path: 'packages/acme-text-normalizer/package.json', label: 'Pacchetto suggerito', flag: 'FLAG_1' },
  { path: 'src/middleware/sanitize.mjs', label: 'Sanitizzazione input', flag: 'FLAG_2' },
  { path: 'src/services/report-renderer.mjs', label: 'Rendering report', flag: 'FLAG_2' },
  { path: 'docs/llm-development-notes.md', label: 'Note di sviluppo LLM', flag: 'FLAG_3' },
  { path: 'data/debug.log', label: 'Log diagnostico', flag: 'FLAG_3' },
  { path: 'server.mjs', label: 'API ordini e autorizzazione', flag: 'FLAG_4' },
  { path: '.github/workflows/ci.yml', label: 'Pipeline CI iniziale', flag: 'FLAG_5' },
  { path: 'docs/safe-patch-guide.md', label: 'Guida patch sicure (facilitatori)', flag: 'GUIDE' }
];
const allowedPaths = new Set(repositoryFiles.map((file) => file.path));
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

let seed = JSON.parse(await readFile(seedPath, 'utf8'));
let state = structuredClone(seed);
const maxRequestBytes = 64 * 1024;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

function text(response, status, payload, type = 'text/plain; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  response.end(payload);
}

function currentUser(request) {
  const requestedId = request.headers['x-demo-user'];
  return state.users.find((user) => user.id === requestedId) || null;
}

function canWriteTicket(ticket, user) {
  return ticket.ownerId === user.id || user.id === 'demo-ops';
}

function findTicket(ticketId) {
  return state.tickets.find((ticket) => ticket.id === ticketId);
}

function findOrder(orderId) {
  return state.orders.find((order) => order.id === orderId);
}

async function requestBody(request) {
  const declaredLength = Number(request.headers['content-length'] || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxRequestBytes) {
    throw new HttpError(413, 'Payload del laboratorio troppo grande');
  }
  const chunks = [];
  let receivedBytes = 0;
  for await (const chunk of request) {
    receivedBytes += chunk.length;
    if (receivedBytes > maxRequestBytes) {
      throw new HttpError(413, 'Payload del laboratorio troppo grande');
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

async function resetLab({ resetTelemetry = true } = {}) {
  seed = JSON.parse(await readFile(seedPath, 'utf8'));
  state = structuredClone(seed);
  if (resetTelemetry) {
    await writeFile(telemetryPath, '# Telemetria locale del laboratorio\n# Nessun dato lascia questo repository.\n', 'utf8');
  }
}

function cspHeaders() {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://*.manus.computer",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff'
  };
}

async function serveStatic(response, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const normalised = path.posix.normalize(requestedPath).replace(/^\/+/, '');
  const absolutePath = path.resolve(publicDir, normalised);
  if (!absolutePath.startsWith(`${publicDir}${path.sep}`) && absolutePath !== path.join(publicDir, 'index.html')) {
    text(response, 403, 'Accesso non consentito');
    return;
  }
  if (!existsSync(absolutePath)) {
    text(response, 404, 'Risorsa non trovata');
    return;
  }
  const extension = path.extname(absolutePath);
  response.writeHead(200, { ...cspHeaders(), 'Content-Type': mimeTypes[extension] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  response.end(await readFile(absolutePath));
}

async function handleApi(request, response, url) {
  const { pathname, searchParams } = url;

  if (request.method === 'GET' && pathname === '/api/health') {
    json(response, 200, { ok: true, mode: 'training-only', externalCalls: 0 });
    return;
  }
  const user = currentUser(request);
  if (!user) {
    json(response, 401, { error: 'Selezionare un’identità demo valida per operare nel laboratorio.' });
    return;
  }
  if (request.method === 'GET' && pathname === '/api/status') {
    json(response, 200, {
      lab: { name: 'AstraShop Training', scope: 'LOCAL_ONLY', resettable: true },
      currentUser: user,
      counts: { tickets: state.tickets.length, orders: state.orders.length, findings: state.findings.length },
      flags: [
        { id: 'FLAG_1', title: 'Supply chain', status: 'investigate' },
        { id: 'FLAG_2', title: 'Input handling', status: 'investigate' },
        { id: 'FLAG_3', title: 'Secret exposure', status: 'investigate' },
        { id: 'FLAG_4', title: 'Authorization', status: 'investigate' },
        { id: 'FLAG_5', title: 'CI quality gates', status: 'investigate' }
      ]
    });
    return;
  }
  if (request.method === 'GET' && pathname === '/api/users') {
    json(response, 200, { users: state.users });
    return;
  }
  if (request.method === 'GET' && pathname === '/api/session') {
    json(response, 200, { user });
    return;
  }
  if (request.method === 'GET' && pathname === '/api/tickets') {
    json(response, 200, { tickets: state.tickets });
    return;
  }
  if (request.method === 'POST' && /^\/api\/tickets\/[^/]+\/note$/.test(pathname)) {
    const noteTicketId = decodeURIComponent(pathname.split('/')[3]);
    const noteTicket = findTicket(noteTicketId);
    if (!noteTicket) return json(response, 404, { error: 'Ticket non trovato' });
    if (!canWriteTicket(noteTicket, user)) {
      return json(response, 403, { error: 'Solo l’owner del ticket o demo-ops può aggiungere note.' });
    }
    const body = await requestBody(request);
    if (!body || typeof body.body !== 'string' || body.body.trim().length === 0) {
      return json(response, 400, { error: 'Nota non valida' });
    }
    const note = {
      id: `NOTE-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      createdAt: new Date().toISOString(),
      body: sanitizeNote(body.body).slice(0, 1200)
    };
    noteTicket.notes.push(note);
    return json(response, 201, { ticket: noteTicket, note });
  }
  if (request.method === 'GET' && /^\/api\/tickets\/[^/]+$/.test(pathname)) {
    const ticketId = decodeURIComponent(pathname.split('/').pop());
    const ticket = findTicket(ticketId);
    if (!ticket) return json(response, 404, { error: 'Ticket non trovato' });
    return json(response, 200, { ticket });
  }
  if (request.method === 'GET' && pathname.startsWith('/api/reports/')) {
    const ticketId = decodeURIComponent(pathname.split('/').pop());
    const ticket = findTicket(ticketId);
    if (!ticket) return json(response, 404, { error: 'Ticket non trovato' });
    return json(response, 200, { report: renderReport(ticket, { preview: searchParams.get('preview') === 'true' }) });
  }
  if (request.method === 'GET' && pathname === '/api/orders') {
    const mine = state.orders.filter((order) => order.ownerId === user.id);
    return json(response, 200, { orders: mine, user });
  }
  if (request.method === 'GET' && pathname.startsWith('/api/orders/') && pathname.endsWith('/draft')) {
    const orderId = decodeURIComponent(pathname.split('/')[3]);
    // TRAINING VULNERABILITY: identity is checked by the demo header, ownership/tenant is not.
    const order = findOrder(orderId);
    if (!order) return json(response, 404, { error: 'Bozza non trovata' });
    return json(response, 200, { order, requestedBy: user, trainingNotice: 'Route intentionally lacks ownership enforcement.' });
  }
  if (request.method === 'GET' && pathname === '/api/repository') {
    json(response, 200, { files: repositoryFiles });
    return;
  }
  if (request.method === 'GET' && pathname === '/api/repository/file') {
    const filePath = searchParams.get('path');
    if (!filePath || !allowedPaths.has(filePath)) return json(response, 403, { error: 'File non disponibile nel browser del lab' });
    const absolutePath = path.resolve(moduleDir, filePath);
    if (!absolutePath.startsWith(moduleDir)) return json(response, 403, { error: 'Percorso non valido' });
    return json(response, 200, { path: filePath, content: await readFile(absolutePath, 'utf8') });
  }
  if (request.method === 'GET' && pathname === '/api/findings') {
    json(response, 200, { findings: state.findings });
    return;
  }
  if (request.method === 'POST' && pathname === '/api/findings') {
    const body = await requestBody(request);
    const required = ['title', 'category', 'severity', 'evidence', 'remediation'];
    if (!body || required.some((field) => typeof body[field] !== 'string' || body[field].trim().length === 0)) {
      return json(response, 400, { error: 'Completa titolo, categoria, severità, evidenza e remediation.' });
    }
    const finding = {
      id: `F-${String(state.findings.length + 1).padStart(2, '0')}`,
      title: body.title.trim().slice(0, 120),
      category: body.category.trim().slice(0, 60),
      severity: body.severity.trim().slice(0, 20),
      evidence: body.evidence.trim().slice(0, 2400),
      remediation: body.remediation.trim().slice(0, 2400),
      owner: typeof body.owner === 'string' && body.owner.trim() ? body.owner.trim().slice(0, 80) : 'Da assegnare',
      author: user.name,
      createdAt: new Date().toISOString()
    };
    state.findings.unshift(finding);
    return json(response, 201, { finding });
  }
  if (request.method === 'GET' && pathname === '/api/training/telemetry') {
    const telemetry = existsSync(telemetryPath) ? await readFile(telemetryPath, 'utf8') : '';
    return json(response, 200, { telemetry });
  }
  if (request.method === 'POST' && pathname === '/api/training/simulate-package') {
    const event = await simulateSuggestedPackage({ telemetryPath, actor: user.id });
    return json(response, 200, { event });
  }
  if (request.method === 'POST' && pathname === '/api/lab/reset') {
    if (request.headers['x-lab-action'] !== 'reset') {
      return json(response, 403, { error: 'Reset rifiutato: manca l’header di azione del laboratorio.' });
    }
    await resetLab();
    return json(response, 200, { ok: true, message: 'Stato del laboratorio ripristinato.' });
  }
  json(response, 404, { error: 'Endpoint non trovato' });
}

export function createLabServer() {
  return createHttpServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      if (url.pathname.startsWith('/api/')) {
        await handleApi(request, response, url);
      } else {
        await serveStatic(response, url.pathname);
      }
    } catch (error) {
      if (error instanceof HttpError) {
        json(response, error.status, { error: error.message });
        return;
      }
      console.error('[lab-error]', error);
      json(response, 500, { error: 'Errore interno del laboratorio', detail: error.message });
    }
  });
}

export async function resetLabState() {
  await resetLab({ resetTelemetry: false });
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const server = createLabServer();
  server.listen(port, host, () => {
    console.log(`AstraShop Training Lab in ascolto su http://${host}:${port}`);
  });
}
