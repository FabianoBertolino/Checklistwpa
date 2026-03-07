// ── FILA OFFLINE com IndexedDB + Background Sync ──

function idbOpen() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('cipgd_sw', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore('kv');
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e.target.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const req = db.transaction('kv','readonly').objectStore('kv').get(key);
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e.target.error);
  });
}
async function idbSet(key, val) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction('kv','readwrite');
    tx.objectStore('kv').put(val, key);
    tx.oncomplete = res;
    tx.onerror = e => rej(e.target.error);
  });
}

function showToast(msg) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = [
      'position:fixed',
      'bottom:calc(1.5rem + env(safe-area-inset-bottom,0px))',
      'left:50%','transform:translateX(-50%)',
      'background:#161d30','border:1px solid rgba(232,184,52,.45)',
      'color:#e2e8f0','padding:.65rem 1.2rem','border-radius:10px',
      'font-size:.82rem','z-index:9999',
      'box-shadow:0 4px 20px rgba(0,0,0,.45)',
      'max-width:90vw','text-align:center',
      'transition:opacity .4s','pointer-events:none'
    ].join(';');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.style.opacity = '0', 4000);
}

async function enviarOuEnfileirar(dados, queueKey, sheetUrl) {
  async function tryFetch(payload) {
    const fd = new FormData();
    for (const k in payload) fd.append(k, payload[k]);
    const r = await fetch(sheetUrl, { method: 'POST', body: fd });
    if (!r.ok) throw new Error('HTTP ' + r.status);
  }

  if (navigator.onLine) {
    try {
      await tryFetch(dados);
      showToast('✅ Registrado na planilha com sucesso!');
      return;
    } catch (e) { /* cai para enfileirar */ }
  }

  // Salva na fila do IndexedDB
  const queue = await idbGet(queueKey) || [];
  queue.push(dados);
  await idbSet(queueKey, queue);
  showToast('📶 Sem conexão — salvo localmente. Será enviado automaticamente quando voltar a internet.');

  // Registra Background Sync
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('sync-checklists').catch(() => {});
  }
}

// Escuta mensagem do SW quando o sync completar
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'SYNC_RESULT') {
      showToast(e.data.msg);
    }
  });
}
