import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createLabServer, resetLabState } from '../server.mjs';

const telemetryPath = fileURLToPath(new URL('../data/telemetry.log', import.meta.url));

async function withServer(run) {
  await resetLabState();
  const server = createLabServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('health endpoint reports the isolated training mode', async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/api/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.mode, 'training-only');
    assert.equal(body.externalCalls, 0);
  });
});

test('operational endpoints require a valid demo identity', async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/api/status`);
    assert.equal(response.status, 401);
  });
});

test('status exposes the five training flags to a demo identity', async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/api/status`, { headers: { 'x-demo-user': 'demo-alice' } });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.flags.length, 5);
    assert.equal(body.currentUser.id, 'demo-alice');
  });
});

test('ticket notes are writable only by the owner or demo-ops', async () => {
  await withServer(async (origin) => {
    const blocked = await fetch(`${origin}/api/tickets/TKT-1024/note`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-demo-user': 'demo-bruno' },
      body: JSON.stringify({ body: '<strong>MARKER</strong>' })
    });
    assert.equal(blocked.status, 403);

    const allowed = await fetch(`${origin}/api/tickets/TKT-1024/note`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-demo-user': 'demo-alice' },
      body: JSON.stringify({ body: '<strong>MARKER</strong>' })
    });
    assert.equal(allowed.status, 201);
  });
});

test('the order route keeps the intentional ownership finding scoped to demo data', async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/api/orders/ORD-1001/draft`, { headers: { 'x-demo-user': 'demo-bruno' } });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.requestedBy.id, 'demo-bruno');
    assert.equal(body.order.ownerId, 'demo-alice');
  });
});

test('reset requires a dedicated lab action header and test reset preserves telemetry', async () => {
  const before = await readFile(telemetryPath, 'utf8');
  await resetLabState();
  const after = await readFile(telemetryPath, 'utf8');
  assert.equal(after, before);

  await withServer(async (origin) => {
    const blocked = await fetch(`${origin}/api/lab/reset`, { method: 'POST', headers: { 'x-demo-user': 'demo-alice' } });
    assert.equal(blocked.status, 403);

    const allowed = await fetch(`${origin}/api/lab/reset`, {
      method: 'POST',
      headers: { 'x-demo-user': 'demo-alice', 'x-lab-action': 'reset' }
    });
    assert.equal(allowed.status, 200);
  });
});

test('request bodies above the lab limit are rejected', async () => {
  await withServer(async (origin) => {
    const response = await fetch(`${origin}/api/findings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-demo-user': 'demo-alice' },
      body: JSON.stringify({ title: 'x'.repeat(70 * 1024) })
    });
    assert.equal(response.status, 413);
  });
});
