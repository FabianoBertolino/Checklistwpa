// ── FILA OFFLINE — CIPGd-FSA v1.4 ──────────────────────────────────────────

// URLs lidas do config.js — não edite aqui
const QUEUES = {
  'cipgd_4rodas_queue':      CIPGD_CONFIG.URL_4RODAS,
  'cipgd_2rodas_queue':      CIPGD_CONFIG.URL_2RODAS,
  'cipgd_4rodas_desc_queue': CIPGD_CONFIG.URL_4RODAS,
  'cipgd_2rodas_desc_queue': CIPGD_CONFIG.URL_2RODAS
};

// ── IndexedDB helpers ────────────────────────────────────────────────────────
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

// ── Conta pendentes ──────────────────────────────────────────────────────────
async function contarPendentes() {
  let total = 0;
  for (const key of Object.keys(QUEUES)) {
    const q = await idbGet(key) || [];
    total += q.length;
  }
  return total;
}

// ── Indicador de conexão (🟢 / 🔴) ─────────────────────────────────────────
function atualizarIndicadorConexao() {
  let el = document.getElementById('_net_status');
  if (!el) {
    el = document.createElement('div');
    el.id = '_net_status';
    el.style.cssText = [
      'position:fixed',
      'top:calc(0.5rem + env(safe-area-inset-top,0px))',
      'right:0.75rem',
      'font-size:0.68rem',
      'font-family:\'Barlow Condensed\',sans-serif',
      'font-weight:700',
      'letter-spacing:0.06em',
      'padding:0.2rem 0.55rem',
      'border-radius:6px',
      'background:rgba(10,15,30,0.85)',
      'border:1px solid rgba(232,184,52,0.25)',
      'color:#e2e8f0',
      'z-index:9999',
      'pointer-events:none',
      'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(el);
  }
  if (navigator.onLine) {
    el.textContent = '🟢 Online';
    el.style.borderColor = 'rgba(34,197,94,0.4)';
    // Some após 3s quando online para não poluir a tela
    clearTimeout(el._hide);
    el._hide = setTimeout(() => { el.style.opacity = '0'; }, 3000);
  } else {
    el.style.opacity = '1';
    el.textContent = '🔴 Offline';
    el.style.borderColor = 'rgba(239,68,68,0.4)';
    clearTimeout(el._hide);
  }
}

// ── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, duration) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    t.setAttribute('aria-atomic', 'true');
    t.style.cssText = [
      'position:fixed',
      'bottom:calc(1.5rem + env(safe-area-inset-bottom,0px))',
      'left:50%',
      'transform:translateX(-50%)',
      'background:#161d30',
      'border:1px solid rgba(232,184,52,.45)',
      'color:#e2e8f0',
      'padding:.65rem 1.2rem',
      'border-radius:10px',
      'font-size:.82rem',
      'z-index:9999',
      'box-shadow:0 4px 20px rgba(0,0,0,.45)',
      'max-width:90vw',
      'text-align:center',
      'transition:opacity .4s',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = '0'; }, duration || 4000);
}

// ── Banner de pendentes ──────────────────────────────────────────────────────
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
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'assertive');
    banner.style.cssText = [
      'background:rgba(239,68,68,0.12)',
      'border-bottom:1px solid rgba(239,68,68,0.4)',
      'padding:.6rem 1rem',
      'display:flex',
      'align-items:center',
      'gap:.75rem'
    ].join(';');

    const txt = document.createElement('span');
    txt.id = '_banner_txt';
    txt.style.cssText = 'flex:1;font-size:.78rem;color:#e2e8f0;line-height:1.4;';

    const btn = document.createElement('button');
    btn.id = '_btn_reenviar';
    btn.setAttribute('aria-label', 'Reenviar registros pendentes');
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

    // Inserir dentro do .container (abaixo da topbar)
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(banner, container.firstChild);
    } else {
      const topbar = document.querySelector('.topbar');
      if (topbar && topbar.nextSibling) {
        topbar.parentNode.insertBefore(banner, topbar.nextSibling);
      } else {
        document.body.prepend(banner);
      }
    }
  }

  const s = total > 1;
  document.getElementById('_banner_txt').innerHTML =
    '⚠️ <strong style="color:#e8b834">' + total + ' registro' + (s?'s':'') +
    ' pendente' + (s?'s':'') + '</strong> — não enviado' + (s?'s':'') +
    ' à planilha. Toque em <strong style="color:#e8b834">Reenviar</strong> com internet ativa.';
}

// ── Reenvio manual ───────────────────────────────────────────────────────────
async function reenviarPendentes() {
  if (!navigator.onLine) {
    showToast('📶 Sem conexão. Conecte-se à internet e tente novamente.');
    return;
  }

  const btn = document.getElementById('_btn_reenviar');
  if (btn) { btn.textContent = 'Enviando...'; btn.disabled = true; }

  let enviados = 0, falhas = 0;

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

  const s = enviados > 1;
  if (enviados > 0 && falhas === 0) {
    showToast('✅ ' + enviados + ' registro' + (s?'s':'') + ' enviado' + (s?'s':'') + ' com sucesso!', 5000);
  } else if (falhas > 0) {
    showToast('⚠️ ' + enviados + ' enviado(s), ' + falhas + ' falhou. Tente novamente.', 5000);
  }

  await renderBannerPendentes();
}

// ── Envio principal ──────────────────────────────────────────────────────────
async function enviarOuEnfileirar(dados, queueKey, sheetUrl) {
  if (navigator.onLine) {
    try {
      const fd = new FormData();
      for (const k in dados) fd.append(k, dados[k]);
      const r = await fetch(sheetUrl, { method: 'POST', body: fd });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      showToast('✅ Registrado na planilha com sucesso!');
      return;
    } catch (e) { /* cai para enfileirar */ }
  }

  const queue = await idbGet(queueKey) || [];
  queue.push(dados);
  await idbSet(queueKey, queue);
  showToast('📶 Sem conexão — salvo localmente. Abra o app com internet e toque em Reenviar.');

  // Background Sync (Android/Chrome)
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('sync-checklists').catch(() => {});
  }

  await renderBannerPendentes();
}

// ── Inicialização ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Indicador de conexão
  atualizarIndicadorConexao();

  // ── Gravar URLs atuais no IndexedDB para o Service Worker usar ──────────
  // Sempre que o app abre, persiste as URLs do objeto QUEUES no IDB.
  // O SW lê daqui — assim uma troca de URL no Apps Script propaga
  // automaticamente para o Background Sync do Android.
  await sincronizarUrls();

  // Verifica pendentes ao abrir (cobre iPhone com app fechado)
  const total = await contarPendentes();
  if (total > 0) {
    await renderBannerPendentes();
    // Se já tiver internet ao abrir, tenta reenviar automaticamente (iPhone)
    if (navigator.onLine) {
      const temBgSync = 'serviceWorker' in navigator && 'SyncManager' in window;
      if (!temBgSync) {
        // iOS: reenvio automático silencioso ao abrir
        setTimeout(async () => {
          await reenviarPendentes();
        }, 2000);
      }
    }
  }
});

// ── Sincroniza as URLs do QUEUES para o IndexedDB ────────────────────────
// Chamado ao abrir o app. Garante que o SW sempre use a URL mais recente.
// Também migra itens da fila que tenham URL antiga gravada junto ao payload.
async function sincronizarUrls() {
  try {
    // Salva o mapa atual de URLs para o SW usar no Background Sync
    await idbSet('cipgd_urls', QUEUES);

    // Migrar filas: se algum item tiver _url diferente da atual, atualiza
    for (const [queueKey, urlAtual] of Object.entries(QUEUES)) {
      const fila = await idbGet(queueKey) || [];
      if (!fila.length) continue;
      let alterou = false;
      const filaMigrada = fila.map(item => {
        if (item._url && item._url !== urlAtual) {
          alterou = true;
          return { ...item, _url: urlAtual };
        }
        return item;
      });
      if (alterou) {
        await idbSet(queueKey, filaMigrada);
        console.log('[CIPGd] URL migrada na fila ' + queueKey);
      }
    }
  } catch(e) {
    console.warn('[CIPGd] sincronizarUrls:', e);
  }
}

// ── Eventos de conexão ───────────────────────────────────────────────────────
window.addEventListener('online', async () => {
  atualizarIndicadorConexao();
  const temBgSync = 'serviceWorker' in navigator && 'SyncManager' in window;
  if (temBgSync) return; // Android: SW cuida do reenvio

  // iOS: reenvio automático ao reconectar
  const total = await contarPendentes();
  if (total > 0) {
    showToast('🔄 Internet restaurada! Reenviando ' + total + ' registro(s)...', 3000);
    setTimeout(reenviarPendentes, 1500);
  }
});

window.addEventListener('offline', () => {
  atualizarIndicadorConexao();
});

// ── Mensagem do SW (Android Background Sync) ─────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async e => {
    if (e.data && e.data.type === 'SYNC_RESULT') {
      showToast(e.data.msg);
      await renderBannerPendentes();
    }
  });
}
