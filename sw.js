/* Tiene in memoria la grafica dell'app così si apre subito; i dati arrivano sempre freschi dalla rete. */
const VERSIONE = 'bv-v5';
const FILE = ['./', 'index.html', 'css/app.css', 'js/config.js', 'js/logic.js', 'js/api.js', 'js/app.js', 'manifest.webmanifest', 'icone/icona.svg', 'icone/icona-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(FILE.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== VERSIONE).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Prima la rete, chiedendo sempre al server se il file è cambiato (GitHub Pages
  // altrimenti fa usare la copia vecchia per 10 minuti); la copia salvata solo senza connessione.
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then((r) => {
      const copia = r.clone();
      caches.open(VERSIONE).then((c) => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
