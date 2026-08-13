const CACHE = "painel-sinais-v1";
const ARQUIVOS_BASE = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARQUIVOS_BASE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Dados de preço/sinais sempre buscam da rede (tempo real).
  // O resto (interface) pode vir do cache pra abrir rápido/offline.
  if (event.request.url.includes("api.binance.com") || event.request.url.includes("/api/")) return;
  event.respondWith(caches.match(event.request).then((resp) => resp || fetch(event.request)));
});
