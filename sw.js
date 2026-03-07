const CACHE = 'cipgd-v1.3'; // Atualizações: v1.1, v1.2, v2.0...
const ASSETS = [
  './index.html',
  './checklist-4rodas.html',
  './checklist-2rodas.html',
  './manifest.json',
  './offline-queue.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('script.google.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).catch(() => cached)
    )
  );
});

// ── BACKGROUND SYNC ──
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
      notifyClients('\u2705 Registro pendente enviado para a planilha!');
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

// IndexedDB helpers
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
    const req = db.transaction('kv', 'readonly').objectStore('kv').get(key);
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e.target.error);
  });
}
async function idbSet(key, val) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(val, key);
    tx.oncomplete = res;
    tx.onerror = e => rej(e.target.error);
  });
}
