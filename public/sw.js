self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Ignorar qualquer requisição externa (HTTPS) para evitar bloqueios de SSL no Service Worker
  if (event.request.url.startsWith('https')) {
    return;
  }
  
  // Necessário para habilitar o prompt de instalação
  event.respondWith(fetch(event.request));
});
