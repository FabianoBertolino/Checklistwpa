// ── FILA OFFLINE com IndexedDB + Background Sync ──

const QUEUES = {
  'cipgd_4rodas_queue': 'https://script.google.com/macros/s/AKfycbw5AkFln4F18me-S32jrq6AJVamCzoz_JVDvQwYJFbkIRjgmRDWrLkUcOea0bQjOjdv/exec',
  'cipgd_2rodas_queue': 'https://script.google.com/macros/s/AKfycbwJRY1wLA5_KLa2yPh2rh66d5mV_5kqlD5YwxsEywgeJQOuFhqnWDolvmmvfNWVs_rn/exec'
};

// ── IndexedDB helpers ──
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

// ── Conta total de pendentes nas duas filas ──
async function contarPendentes() {
  let total = 0;
  for (const key of Object.keys(QUEUES)) {
    const q = await idbGet(key) || [];
    total += q.length;
  }
  return total;
}

// ── Toast ──
function showToast(msg, duration) {
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
  t._t = setTimeout(() => t.style.opacity = '0', duration || 4000);
}

// ── Banner de pendentes (aparece no topo, com botão reenviar) ──
async function renderBannerPendentes() {
  const total = await contarPendentes();
  let banner = document.getElementById('_banner_pendentes');

  if (total === 0) {
    if (banner) banner.remove();
    return;
  }

  if (!banner) {
    banner = document.createElement('div');
    banner.id = '_banner_pendentes';
    banner.style.cssText = [
      'position:sticky','top:0','z-index:200',
      'background:rgba(239,68,68,0.12)',
      'border-bottom:1px solid rgba(239,68,68,0.4)',
      'padding:.6rem 1rem',
      'display:flex','align-items:center','gap:.75rem',
      'animation:fadeDown .3s ease both'
    ].join(';');

    const txt = document.createElement('span');
    txt.id = '_banner_txt';
    txt.style.cssText = 'flex:1;font-size:.78rem;color:#e2e8f0;line-height:1.4;';

    const btn = document.createElement('button');
    btn.id = '_btn_reenviar';
    btn.style.cssText = [
      'background:#e8b834','color:#0a0f1e',
      'border:none','border-radius:7px',
      'padding:.4rem .85rem',
      'font-family:\'Barlow Condensed\',sans-serif',
      'font-size:.82rem','font-weight:800',
      'letter-spacing:.06em','text-transform:uppercase',
      'cursor:pointer','white-space:nowrap',
      'transition:background .2s'
    ].join(';');
    btn.textContent = 'Reenviar';
    btn.addEventListener('click', reenviarPendentes);

    banner.appendChild(txt);
    banner.appendChild(btn);

    // Inserir logo após a topbar (ou no topo do body)
    const topbar = document.querySelector('.topbar');
    if (topbar && topbar.nextSibling) {
      topbar.parentNode.insertBefore(banner, topbar.nextSibling);
    } else {
      document.body.prepend(banner);
    }
  }

  const txt = document.getElementById('_banner_txt');
  txt.innerHTML = '⚠️ <strong style="color:#e8b834">' + total + ' registro' + (total > 1 ? 's' : '') + ' pendente' + (total > 1 ? 's' : '') + '</strong> — não enviado' + (total > 1 ? 's' : '') + ' à planilha. Toque em Reenviar com internet ativa.';
}

// ── Reenvio manual (funciona no iPhone) ──
async function reenviarPendentes() {
  if (!navigator.onLine) {
    showToast('📶 Sem conexão. Conecte-se à internet e tente novamente.');
    return;
  }

  const btn = document.getElementById('_btn_reenviar');
  if (btn) { btn.textContent = 'Enviando...'; btn.disabled = true; }

  let enviados = 0;
  let falhas = 0;

  for (const [queueKey, sheetUrl] of Object.entries(QUEUES)) {
    const queue = await idbGet(queueKey) || [];
    if (!queue.length) continue;
    const failed = [];
    for (const payload of queue) {
      try {
        const fd = new FormData();
        for (const k in payload) fd.append(k, payload[k]);
        const r = await fetch(sheetUrl, { method: 'POST', body: fd });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        enviados++;
      } catch (e) {
        failed.push(payload);
        falhas++;
      }
    }
    await idbSet(queueKey, failed);
  }

  if (btn) { btn.textContent = 'Reenviar'; btn.disabled = false; }

  if (enviados > 0 && falhas === 0) {
    showToast('✅ ' + enviados + ' registro' + (enviados > 1 ? 's' : '') + ' enviado' + (enviados > 1 ? 's' : '') + ' com sucesso!', 5000);
  } else if (falhas > 0) {
    showToast('⚠️ ' + enviados + ' enviado(s), ' + falhas + ' falhou. Tente novamente.', 5000);
  }

  await renderBannerPendentes();
}

// ── Envio principal: tenta direto ou enfileira ──
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

  const queue = await idbGet(queueKey) || [];
  queue.push(dados);
  await idbSet(queueKey, queue);
  showToast('📶 Sem conexão — salvo localmente. Abra o app com internet e toque em Reenviar.');

  // Background Sync para Android/Chrome
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('sync-checklists').catch(() => {});
  }

  await renderBannerPendentes();
}

// ── Ao carregar a página: mostra banner se houver pendentes ──
document.addEventListener('DOMContentLoaded', () => {
  renderBannerPendentes();
});

// ── Mensagem do SW (Android Background Sync) ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async e => {
    if (e.data && e.data.type === 'SYNC_RESULT') {
      showToast(e.data.msg);
      await renderBannerPendentes();
    }
  });
}

// ── Ao voltar online: reenvio apenas se Background Sync NÃO estiver disponível (iOS) ──
window.addEventListener('online', async () => {
  const temBackgroundSync = 'serviceWorker' in navigator && 'SyncManager' in window;
  if (temBackgroundSync) return; // Android/Chrome: o SW cuida do reenvio, evita duplicar

  const total = await contarPendentes();
  if (total > 0) {
    showToast('🔄 Internet restaurada! Reenviando ' + total + ' registro(s)...', 3000);
    setTimeout(reenviarPendentes, 1500);
  }
});
