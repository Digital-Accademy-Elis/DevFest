const state = {
  view: 'dashboard',
  userId: localStorage.getItem('astrashop.demoUser') || 'demo-alice',
  users: [],
  selectedTicketId: null,
  selectedRepoPath: 'package.json',
  selectedOrderId: 'ORD-1001'
};

const root = document.querySelector('#view-root');
const title = document.querySelector('#view-title');
const notice = document.querySelector('#notice');
const userSelect = document.querySelector('#demo-user');
const navButtons = [...document.querySelectorAll('.nav-item')];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[character]));
}

function formatDate(value) {
  return new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

async function api(path, options = {}) {
  const { labAction, headers: extraHeaders = {}, ...fetchOptions } = options;
  const headers = { 'x-demo-user': state.userId, ...extraHeaders };
  if (labAction) headers['x-lab-action'] = labAction;
  if (fetchOptions.body) headers['Content-Type'] = 'application/json';
  const response = await fetch(path, { ...fetchOptions, headers });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Operazione non riuscita');
  return payload;
}

function setNotice(message = '', tone = 'safe') {
  notice.textContent = message;
  notice.style.color = tone === 'danger' ? 'var(--pink)' : 'var(--cyan)';
}

function activateNavigation(view) {
  state.view = view;
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  const labels = {
    dashboard: 'Security review console', tickets: 'Ticket & report preview', orders: 'Bozze d’ordine',
    repository: 'Repository explorer', findings: 'Finding board', guide: 'Regole & guide'
  };
  title.textContent = labels[view];
}

function codeLines(content) {
  return content.split('\n').map((line, index) => `<span class="line-number">${String(index + 1).padStart(2, '0')}</span>${escapeHtml(line)}`).join('\n');
}

async function initialise() {
  const { users } = await api('/api/users');
  state.users = users;
  userSelect.innerHTML = users.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} · ${escapeHtml(user.role)}</option>`).join('');
  userSelect.value = state.userId;
  await render();
}

async function renderDashboard() {
  const status = await api('/api/status');
  root.innerHTML = `
    <div class="command-grid">
      <div class="stack">
        <section class="panel">
          <p class="tag safe">[MISSION CONTROL]</p>
          <h2>Raccogli prove, non supposizioni.</h2>
          <p class="muted">Sei il Security Enablement Team incaricato di valutare AstraShop prima del go-live. Tutto ciò che vedi è fittizio, confinato e resettabile.</p>
          <div class="button-row">
            <button class="button" data-action="open-view" data-view="repository">Apri il repository</button>
            <button class="button secondary" data-action="open-view" data-view="guide">Leggi le regole</button>
          </div>
        </section>
        <section class="grid-3">
          <article class="card"><p class="tag">TICKET</p><p class="stat-number">${status.counts.tickets}</p><p class="muted small">casi di supporto fittizi</p></article>
          <article class="card"><p class="tag">ORDERS</p><p class="stat-number">${status.counts.orders}</p><p class="muted small">bozze con ownership demo</p></article>
          <article class="card"><p class="tag">FINDINGS</p><p class="stat-number">${status.counts.findings}</p><p class="muted small">salvati nel lab</p></article>
        </section>
        <section class="panel">
          <div class="panel-header"><div><p class="tag">[CURRENT IDENTITY]</p><h3>${escapeHtml(status.currentUser.name)}</h3></div><span class="chip cyan">${escapeHtml(status.currentUser.role)}</span></div>
          <p class="muted">Tenant: <strong>${escapeHtml(status.currentUser.tenantId)}</strong> · Cambia identità nel selettore in alto per confrontare permessi e ownership.</p>
        </section>
      </div>
      <aside class="panel">
        <div class="panel-header"><div><p class="tag danger">[FLAG QUEUE]</p><h3>5 superfici da analizzare</h3></div></div>
        <div class="flag-overview">
          ${status.flags.map((flag) => `<div class="flag-row"><strong>${flag.id}</strong><p>${escapeHtml(flag.title)}</p><span>INVESTIGATE</span></div>`).join('')}
        </div>
      </aside>
    </div>`;
}

async function renderTickets() {
  const { tickets } = await api('/api/tickets');
  const selected = tickets.find((ticket) => ticket.id === state.selectedTicketId) || tickets[0];
  state.selectedTicketId = selected.id;
  root.innerHTML = `
    <div class="command-grid">
      <section class="panel">
        <div class="panel-header"><div><p class="tag danger">[FLAG_2 / INPUT HANDLING]</p><h2>Ticket & report preview</h2><p>La nota passa da una funzione chiamata <code>sanitizeNote()</code> prima del report.</p></div></div>
        <div class="ticket-detail">
          <div class="callout warning"><p><strong>Vincolo del lab.</strong> Per la dimostrazione usare esclusivamente markup innocuo e visibile. La CSP blocca script inline e chiamate esterne.</p></div>
          <div><span class="chip">${escapeHtml(selected.id)}</span> <span class="chip">${escapeHtml(selected.status)}</span> <h3>${escapeHtml(selected.title)}</h3><p class="muted">Cliente: ${escapeHtml(selected.customer)} · Owner: ${escapeHtml(selected.ownerId)}</p></div>
          <div class="notes">${selected.notes.map((note) => `<article class="note"><p>${escapeHtml(note.body)}</p><small>${escapeHtml(note.authorName)} · ${formatDate(note.createdAt)}</small></article>`).join('')}</div>
          <form id="note-form">
            <div class="field"><label for="note-body">Aggiungi una nota di test</label><textarea id="note-body" name="body" placeholder="Esempio consentito: &lt;strong&gt;MARKER DI TEST&lt;/strong&gt;"></textarea></div>
            <div class="button-row"><button class="button" type="submit">Salva la nota</button><button class="button secondary" type="button" data-action="preview-report" data-ticket="${escapeHtml(selected.id)}">Apri preview report</button></div>
          </form>
          <div id="report-preview"></div>
        </div>
      </section>
      <aside class="panel"><p class="tag">[TICKET QUEUE]</p><ul class="list">${tickets.map((ticket) => `<li class="list-item"><button data-action="select-ticket" data-ticket="${escapeHtml(ticket.id)}"><span class="list-title">${escapeHtml(ticket.id)} · ${escapeHtml(ticket.title)}</span><span class="list-meta">${escapeHtml(ticket.customer)} · ${escapeHtml(ticket.status)}</span></button></li>`).join('')}</ul></aside>
    </div>`;
  document.querySelector('#note-form').addEventListener('submit', submitNote);
}

async function submitNote(event) {
  event.preventDefault();
  const body = new FormData(event.currentTarget).get('body');
  try {
    await api(`/api/tickets/${encodeURIComponent(state.selectedTicketId)}/note`, { method: 'POST', body: JSON.stringify({ body }) });
    setNotice('Nota aggiunta nello stato fittizio del lab. Ora apri la preview report.', 'safe');
    await render();
  } catch (error) { setNotice(error.message, 'danger'); }
}

async function showReportPreview(ticketId) {
  try {
    const { report } = await api(`/api/reports/${encodeURIComponent(ticketId)}?preview=true`);
    const target = document.querySelector('#report-preview');
    target.innerHTML = `<div class="preview-notice">[INTENTIONAL TRAINING SINK] Preview HTML interna</div><article class="preview-frame"><h4>${escapeHtml(report.title)}</h4><p>${escapeHtml(report.summary)}</p><div class="report-note" id="unsafe-report-note"></div></article>`;
    // TRAINING VULNERABILITY: the browser renders the note as HTML in this one lab-only preview.
    document.querySelector('#unsafe-report-note').innerHTML = report.noteHtml;
    setNotice('Preview caricata. Segui source → trasformazioni → sink nel repository.', 'safe');
  } catch (error) { setNotice(error.message, 'danger'); }
}

async function renderOrders() {
  const { orders, user } = await api('/api/orders');
  root.innerHTML = `
    <div class="command-grid">
      <section class="panel">
        <p class="tag danger">[FLAG_4 / BOLA - IDOR]</p>
        <h2>Autenticato non significa autorizzato.</h2>
        <p class="muted">L'interfaccia mostra le bozze di <strong>${escapeHtml(user.name)}</strong>. La route di dettaglio richiede un'identità demo, ma cosa verifica sulla risorsa?</p>
        <div class="grid-2">
          <div class="card"><p class="tag safe">I MIEI ORDINI</p>${orders.length ? orders.map((order) => `<p><strong>${escapeHtml(order.id)}</strong> · ${escapeHtml(order.customer)}<br><span class="muted small">${escapeHtml(order.status)} · € ${escapeHtml(order.amount)}</span></p>`).join('') : '<p class="muted">Nessuna bozza assegnata.</p>'}</div>
          <div class="card"><p class="tag danger">ISPEZIONA BOZZA</p><form id="order-form"><div class="field"><label for="order-id">ID ordine</label><input id="order-id" name="orderId" value="${escapeHtml(state.selectedOrderId)}" /></div><button class="button" type="submit">Carica draft</button></form></div>
        </div>
        <div id="order-result" class="order-detail"></div>
      </section>
      <aside class="panel"><p class="tag">[DEMO IDENTITIES]</p>${state.users.map((demo) => `<article class="list-item"><span class="list-title">${escapeHtml(demo.name)}</span><span class="list-meta">${escapeHtml(demo.id)} · tenant ${escapeHtml(demo.tenantId)}</span></article>`).join('')}<div class="callout warning"><p><strong>Hint.</strong> Passa a <code>demo-bruno</code> e valuta cosa accade chiedendo una bozza di Alice.</p></div></aside>
    </div>`;
  document.querySelector('#order-form').addEventListener('submit', inspectOrder);
}

async function inspectOrder(event) {
  event.preventDefault();
  const orderId = new FormData(event.currentTarget).get('orderId').trim();
  state.selectedOrderId = orderId;
  const target = document.querySelector('#order-result');
  try {
    const { order, requestedBy } = await api(`/api/orders/${encodeURIComponent(orderId)}/draft`);
    const crossOwner = order.ownerId !== requestedBy.id;
    target.innerHTML = `<article class="card ${crossOwner ? 'finding' : ''}"><p class="tag ${crossOwner ? 'danger' : 'safe'}">${crossOwner ? '[EVIDENZA DI OWNERSHIP MANCANTE]' : '[RISORSA DEL CONTESTO CORRENTE]'}</p><h3>${escapeHtml(order.id)} · ${escapeHtml(order.customer)}</h3><p>${escapeHtml(order.description)}</p><p class="muted">Owner: ${escapeHtml(order.ownerId)} · Tenant: ${escapeHtml(order.tenantId)} · Richiesto da: ${escapeHtml(requestedBy.id)}</p>${crossOwner ? '<div class="callout warning"><p>La route ha restituito una risorsa fuori dal tenant/owner corrente. Documenta la prova e cerca il filtro query mancante.</p></div>' : ''}</article>`;
    setNotice('Bozza caricata dal solo ambiente fittizio.', crossOwner ? 'danger' : 'safe');
  } catch (error) { target.innerHTML = ''; setNotice(error.message, 'danger'); }
}

async function renderRepository() {
  const { files } = await api('/api/repository');
  const selected = files.find((file) => file.path === state.selectedRepoPath) || files[0];
  state.selectedRepoPath = selected.path;
  const file = await api(`/api/repository/file?path=${encodeURIComponent(selected.path)}`);
  root.innerHTML = `
    <section class="panel"><div class="panel-header"><div><p class="tag">[REPOSITORY EXPLORER]</p><h2>Leggi il codice come una mappa di assunzioni.</h2><p class="muted">I file sotto sono una selezione didattica. Il repository completo rimane disponibile nel filesystem del lab.</p></div><button class="button secondary" data-action="simulate-package">Simula installazione locale</button></div>
      <div class="repo-layout"><aside class="card"><p class="tag">[FILE INDEX]</p>${files.map((item) => `<button class="file-button ${item.path === selected.path ? 'active' : ''}" data-action="select-file" data-path="${escapeHtml(item.path)}"><strong>${escapeHtml(item.path)}</strong><small>${escapeHtml(item.flag)} · ${escapeHtml(item.label)}</small></button>`).join('')}</aside>
      <div class="stack"><div class="card"><div class="panel-header"><div><p class="tag safe">${escapeHtml(selected.flag)}</p><h3>${escapeHtml(file.path)}</h3></div><span class="chip">read-only in UI</span></div><div class="code-window"><pre>${codeLines(file.content)}</pre></div></div><div id="telemetry-panel"></div></div></div>
    </section>`;
  await renderTelemetry();
}

async function renderTelemetry() {
  const { telemetry } = await api('/api/training/telemetry');
  const panel = document.querySelector('#telemetry-panel');
  if (!panel) return;
  panel.innerHTML = `<div class="card"><p class="tag danger">[LOCAL TELEMETRY]</p><div class="code-window"><pre>${codeLines(telemetry || '# Nessun evento registrato')}</pre></div></div>`;
}

async function simulatePackage() {
  try {
    await api('/api/training/simulate-package', { method: 'POST' });
    setNotice('Simulazione completata: è stata scritta solo una riga nel log locale del laboratorio.', 'safe');
    await renderTelemetry();
  } catch (error) { setNotice(error.message, 'danger'); }
}

async function renderFindings() {
  const { findings } = await api('/api/findings');
  root.innerHTML = `
    <div class="command-grid"><section class="panel"><p class="tag safe">[EVIDENCE BOARD]</p><h2>Trasforma il finding in una decisione.</h2><p class="muted">Questo form salva solo nello stato in memoria del lab. Il reset cancella tutti i finding inseriti.</p>
      <form id="finding-form" class="form-grid"><div class="field"><label for="finding-title">Titolo</label><input required id="finding-title" name="title" placeholder="Es. Ownership non verificata" /></div><div class="field"><label for="finding-category">Categoria</label><select id="finding-category" name="category"><option>Supply chain</option><option>Input handling</option><option>Secret exposure</option><option>Authorization</option><option>CI/CD</option></select></div><div class="field"><label for="finding-severity">Severità</label><select id="finding-severity" name="severity"><option>Alta</option><option>Media</option><option>Bassa</option></select></div><div class="field"><label for="finding-owner">Owner proposto</label><input id="finding-owner" name="owner" placeholder="Platform team" /></div><div class="field full"><label for="finding-evidence">Evidenza nel lab</label><textarea required id="finding-evidence" name="evidence" placeholder="File, flusso e riproduzione sicura minima"></textarea></div><div class="field full"><label for="finding-remediation">Remediation e test</label><textarea required id="finding-remediation" name="remediation" placeholder="Patch proposta, test di regressione e gate preventivo"></textarea></div><div class="button-row full"><button class="button" type="submit">Salva finding</button><button class="button danger-button" type="button" data-action="reset-lab">Reset completo</button></div></form><p id="finding-error" class="form-error"></p></section>
      <aside class="panel"><p class="tag">[SAVED FINDINGS]</p>${findings.length ? findings.map((finding) => `<article class="finding card"><span class="chip pink">${escapeHtml(finding.severity)}</span><h3>${escapeHtml(finding.title)}</h3><p class="finding-meta">${escapeHtml(finding.category)} · ${escapeHtml(finding.author)} · ${formatDate(finding.createdAt)}</p><p>${escapeHtml(finding.evidence)}</p><p class="muted"><strong>Proposta:</strong> ${escapeHtml(finding.remediation)}</p></article>`).join('') : '<div class="empty-state"><p>Nessun finding ancora salvato.</p></div>'}</aside></div>`;
  document.querySelector('#finding-form').addEventListener('submit', submitFinding);
}

async function submitFinding(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());
  try {
    await api('/api/findings', { method: 'POST', body: JSON.stringify(payload) });
    setNotice('Finding salvato. Collega sempre evidenza, patch, test e owner.', 'safe');
    await render();
  } catch (error) { document.querySelector('#finding-error').textContent = error.message; }
}

async function resetLab() {
  if (!window.confirm('Ripristinare note, finding e telemetria allo stato iniziale?')) return;
  try {
    await api('/api/lab/reset', { method: 'POST', labAction: 'reset' });
    setNotice('Laboratorio ripristinato allo stato seed.', 'safe');
    await render();
  } catch (error) { setNotice(error.message, 'danger'); }
}

async function renderGuide() {
  root.innerHTML = `
    <div class="command-grid"><section class="panel"><p class="tag safe">[RULES OF ENGAGEMENT]</p><h2>Confini del laboratorio</h2><div class="rule-list"><div class="rule"><div><strong>Opera solo qui.</strong><p class="muted">Nessun dominio, registry, account o servizio esterno.</p></div></div><div class="rule"><div><strong>Usa solo dati demo.</strong><p class="muted">Non incollare segreti, prompt, configurazioni o informazioni aziendali reali.</p></div></div><div class="rule"><div><strong>PoC minime.</strong><p class="muted">Dimostra il rischio con il minor impatto possibile e passa alla mitigazione.</p></div></div><div class="rule"><div><strong>Documenta, non sfruttare.</strong><p class="muted">Ogni flag richiede evidenza, remediation, test e prevenzione.</p></div></div><div class="rule"><div><strong>Reset finale.</strong><p class="muted">Al termine ripristina l'ambiente e rimuovi gli artefatti locali.</p></div></div></div></section>
    <aside class="stack"><section class="panel"><p class="tag danger">[DEMO USERS]</p><h3>Identità disponibili</h3>${state.users.map((user) => `<p><strong>${escapeHtml(user.name)}</strong><br><span class="muted small">${escapeHtml(user.id)} · ${escapeHtml(user.role)} · tenant ${escapeHtml(user.tenantId)}</span></p>`).join('')}</section><section class="panel"><p class="tag safe">[CONSEGNA TEAM]</p><h3>Per ogni flag</h3><p class="muted">1. Identifica l'assunzione.<br>2. Raccogli evidenza sicura.<br>3. Spiega l'impatto.<br>4. Proponi patch e test.<br>5. Aggiungi un controllo di processo o CI.</p></section></aside></div>`;
}

async function render() {
  root.innerHTML = '<div class="empty-state"><p>Caricamento della vista…</p></div>';
  try {
    if (state.view === 'dashboard') await renderDashboard();
    if (state.view === 'tickets') await renderTickets();
    if (state.view === 'orders') await renderOrders();
    if (state.view === 'repository') await renderRepository();
    if (state.view === 'findings') await renderFindings();
    if (state.view === 'guide') await renderGuide();
  } catch (error) {
    root.innerHTML = `<div class="empty-state"><p>${escapeHtml(error.message)}</p></div>`;
    setNotice(error.message, 'danger');
  }
}

navButtons.forEach((button) => button.addEventListener('click', async () => {
  activateNavigation(button.dataset.view);
  await render();
}));

userSelect.addEventListener('change', async () => {
  state.userId = userSelect.value;
  localStorage.setItem('astrashop.demoUser', state.userId);
  setNotice(`Identità demo attiva: ${userSelect.options[userSelect.selectedIndex].text}`, 'safe');
  await render();
});

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action } = button.dataset;
  if (action === 'open-view') { activateNavigation(button.dataset.view); await render(); }
  if (action === 'select-ticket') { state.selectedTicketId = button.dataset.ticket; await render(); }
  if (action === 'preview-report') await showReportPreview(button.dataset.ticket);
  if (action === 'select-file') { state.selectedRepoPath = button.dataset.path; await render(); }
  if (action === 'simulate-package') await simulatePackage();
  if (action === 'reset-lab') await resetLab();
});

initialise();
