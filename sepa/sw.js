/* Service worker del panel SEPA JS-TECH.
   - NUNCA cachea llamadas al bridge (ngrok): siempre red.
   - network-first para el resto (la app funciona offline con lo último visto). */
const CACHE = 'sepa-jst-v1';
const ESTATICOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESTATICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API del bridge: siempre red, sin cache
  if (url.hostname.endsWith('.ngrok-free.dev')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // estáticos: network-first con fallback a caché
  e.respondWith(
    fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
