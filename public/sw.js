// Service Worker para la Prayer Tracker App
const CACHE_NAME = 'prayer-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/betelistii_red.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalar el Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar el Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar las solicitudes
self.addEventListener('fetch', event => {
  // Solo cachear solicitudes GET
  if (event.request.method !== 'GET') return;
  
  // No cachear las solicitudes a la API
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Responder desde la caché si está disponible
        if (response) {
          return response;
        }
        
        // De lo contrario, obtener desde la red
        return fetch(event.request)
          .then(response => {
            // No cachear si la respuesta no es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar la respuesta para cachear
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});