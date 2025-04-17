// Registro del Service Worker para soporte PWA

export function registerServiceWorker() {
  // Solo registrar el Service Worker en producción o cuando no estamos en localhost
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  const shouldRegister = 'serviceWorker' in navigator && 
                         (import.meta.env.PROD || !isLocalhost);
  
  if (shouldRegister) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registrado correctamente:', registration.scope);
        })
        .catch(error => {
          console.log('Error al registrar Service Worker:', error);
        });
    });
  } else {
    console.log('Service Worker no registrado (entorno de desarrollo)');
  }
}