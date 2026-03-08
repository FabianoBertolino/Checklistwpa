// ── SERVICE WORKER — CIPGd-FSA v1.4 ─────────────────────────────────────────
const CACHE = 'cipgd-v1.6';

const ASSETS = [
  './',
  './index.html',
  './checklist-4rodas.html',
  './checklist-2rodas.html',
  './manifest.json',
  './offline-queue.js',
  './theme.js',
  './icon-192.png',
  './icon-512.png'
];

// ── INSTALL: cacheia todos os arquivos ───────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE: remove caches antigos ─────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: Cache First + atualiza em background ──────────────────────────────
self.addEventListener('fetch', e => {
  // Nunca intercepta requisições ao Google Sheets
  if (e.request.url.includes('script.google.com')) return;
  // Nunca intercepta requisições de fontes externas (Google Fonts)
  if (e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('fonts.gstatic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Busca atualização em background (stale-while-revalidate)
      const fetchPromise = fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE).then(cache => {
            cache.put(e.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => null);

      // Retorna cache imediatamente se disponível, senão espera a rede
      return cached || fetchPromise;
    })
  );
});

// ── BACKGROUND SYNC (Android/Chrome) ────────────────────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-checklists') {
    e.waitUntil(syncAll());
  }
});

async function syncAll() {
  await processQueue(
    'cipgd_4rodas_queue',
    'https://script.google.com/macros/s/AKfycbw5AkFln4F18me-S32jrq6AJVamCzoz_JVDvQwYJFbkIRjgmRDWrLkUcOea0bQjOjdv/exec'
  );
  await processQueue(
    'cipgd_2rodas_queue',
    'https://script.google.com/macros/s/AKfycbwJRY1wLA5_KLa2yPh2rh66d5mV_5kqlD5YwxsEywgeJQOuFhqnWDolvmmvfNWVs_rn/exec'
  );
}

async function processQueue(queueKey, sheetUrl) {
  const queue = await idbGet(queueKey) || [];
  if (!queue.length) return;
  const failed = [];
  for (const payload of queue) {
    try {
      const fd = new FormData();
      for (const k in payload) fd.append(k, payload[k]);
      const r = await fetch(sheetUrl, { method: 'POST', body: fd });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      notifyClients('✅ Registro pendente enviado para a planilha!');
    } catch (err) {
      failed.push(payload);
    }
  }
  await idbSet(queueKey, failed);
}

function notifyClients(msg) {
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(c => c.postMessage({ type: 'SYNC_RESULT', msg }));
  });
}

// ── IndexedDB helpers (SW context) ──────────────────────────────────────────
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
