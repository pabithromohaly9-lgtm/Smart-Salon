import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-sw.js";

const CACHE_NAME = 'smart-salon-v18';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.css',
  'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap',
  'https://cdn.tailwindcss.com'
];

// Firebase Config for SW
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "smart-salon-da136.firebaseapp.com",
  projectId: "smart-salon-da136",
  storageBucket: "smart-salon-da136.appspot.com",
  messagingSenderId: "1089782411445",
  appId: "1:1089782411445:web:..."
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle Firebase background messages
onBackgroundMessage(messaging, (payload) => {
  console.log('[sw.js] Background message received', payload);
  const notificationTitle = payload.notification.title || 'Smart Salon';
  const notificationOptions = {
    body: payload.notification.body || 'আপনার একটি নতুন আপডেট আছে।',
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMQCisSBy88ygAAGXNJREFUeNrtXFtsFNcZ/s6Z2fX6An7AxmCInSZXS9pKaZpWpS99oU8N8pS0D02lSjt96EPUt6pS2qrUPlSVSvWhqu0DbeXhS6X2oWoaC60UVYmSAnYIdgx2fMGv9Xp3Z87pQ87urms767V7Z73reP5IsuecmfOf73z/+f//nP8M6K9+PZ6V0fUu6C96Cej0EtDpJaDTS0Cn/7fH9Oofj8f37dvH9PT0MD09TbXWv997Ym7at28f09PTzDT77B/L0UfX6pXp87k9PT1mZmaGmY8++sd09NG1enm9mZ9+87D56V6Z+Z9//ofv9H++T3Xp6P8XAnS9C/qLXgI6vQR0egno9BLQ6f+N6eU5vTAnF8f0wpzc4zM9+uha/X297P8pArS3B8D992f02V6Z3Sszv7Y7B+7v00mX6vK679Vl+n9LQP/vY3p5Ti/M939uX993v7b/e79OulSXuulSXe/+uL/+WwS0t9f776/m79f29YF7dfLfv96lk9/tX/79/6/X/1cC7u/TSZfqUvfv/+H/C8Vw89V7P79XJ/+98H7tfF9fp/v7dNIl7f86AdS53v9X/89f6v/m8f0/v78mXUq778f08v9nBPSBv/hS7/+H+/Nq0qW6dP8/IaAOfD8fF97X99dfn5uH5uUu1fXur3v7v0mApq9f//W5vP69vF9fv0vX6v/+/8/p97G6Xv/X7/W5Xv8/3p9Xky5p/zcJ+H96fP9Pe9yH+795fK/vO72fV5MupenP7+9jfX1/Xf83CdDXr0vXd9/vXv++pP69Wl1K+/+9pEvp5X99vX6v/7v/f5UAff3/C8X368Pr8+pS3Xv/u19NupSe/v/m8T29/O+v1+/1uV7/Nwn4f2p+P66f6+N5fS9p/L+XvP/Xv9P/vUvdfK9X/78f1/9NAv6fXv77+vD6vF7fP97fS3X/v/fXpEvp5X99vX6v/7v/f5UAff36fGpfX/++9P7//6S69P7/VdL/v0vdfK+v+6v/XyVA99f38vB8fV6v7zt9/68u3X//XpPu//d7/X+/v77ur+7/NwnQpbpU17u/7u3/JgHe/U8oqXf/E0rXv9un9//6e993uuv6v73+76/v7zM9+uha/f/vP/6H79f/Xyf959L9P6m6dP+ve/u/ScD9fTrpUl3v/rq3/5sEePc/oaTe/U8oXf9un97/6+993+mu6//2+r+/vr/P9Oij6+X9f9Kff/+fXv/+6X8K+u8T/fP+/8v6v1B9//9v9v/9+3X//X9f9/f1/v+rvUeA9rXv6/v+f1/39/W5Pp7X9/LwfH1er+87ve9f769f37+Xh+f19Xf/U9A/5/0TfW6f63M97uP5fX0830vX6v/v/fXr8710Xf/+fwn4T8X78+rS9X9vX99v5vH99df38/B8fd8/3t+LOnm9Ptcn7e93v3n/m/fXpAz/f78/v79Pf366RL/9/j9X29r+/v69v379f1df/+/X+VupQ6Xfp/6un/P9Pn8vpevlbf/1Kd7On//9L6e87fX+r//X73+L7Te69f1/f1vb6/v79P9//u5eX9v1SXu/Xf/69fV5cu1en/O70v6X96X6rL3fr7p3Xp/p909fS/+3+pf+789f26Ptf7+5cu9fUupv9/y/1//f0//v7vX/9f7/f9f3/9v9v9vVf8fWf/3/P//AXH9+qfX9Xre/T7v7/V5Ppf7eH4v9/+999f1+v8/D9fne3m/f9fr8/teXv6X1/cuve6v/39S/Xv6n/7vXvr/7fX+pUv9v//X/9vV/9vT/28u9f8z/f8v9f9T/X+XfP8z9f/f7P+f6v9f6v9fWf8Pmf9/dfX/8fq/5/+v+f/n9f/X9P839f839P9v9f838v//N6v/v9f/v7L+HzL///r6/0j9f8z8X/f6f6/6f7/6f//6f//6f//6f/8Bf2YVp6v1LdYAAAAASUVORK5CYII=',
    badge: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMQCisSBy88ygAAGXNJREFUeNrtXFtsFNcZ/s6Z2fX6An7AxmCInSZXS9pKaZpWpS99oU8N8pS0D02lSjt96EPUt6pS2qrUPlSVSvWhqu0DbeXhS6X2oWoaC60UVYmSAnYIdgx2fMGv9Xp3Z87pQ87urms767V7Z73reP5IsuecmfOf73z/+f//nP8M6K9+PZ6V0fUu6C96Cej0EtDpJaDTS0Cn/7fH9Oofj8f37dvH9PT0MD09TbXWv997Ym7at28f09PTzDT77B/L0UfX6pXp87k9PT1mZmaGmY8++sd09NG1enm9mZ9+87D56V6Z+Z9//ofv9H++T3Xp6P8XAnS9C/qLXgI6vQR0egno9BLQ6f+N6eU5vTAnF8f0wpzc4zM9+uha/X297P8pArS3B8D992f02V6Z3Sszv7Y7B+7v00mX6vK679Vl+n9LQP/vY3p5Ti/M939uX993v7b/e79OulSXuulSXe/+uL/+WwS0t9f776/m79f29YF7dfLfv96lk9/tX/79/6/X/1cC7u/TSZfqUvfv/+H/C8Vw89V7P79XJ/+98H7tfF9fp/v7dNIl7f86AdS53v9X/89f6v/m8f0/v78mXUq778f08v9nBPSBv/hS7/+H+/Nq0qW6dP8/IaAOfD8fF97X99dfn5uH5uUu1fXur3v7v0mApq9f//W5vP69vF9fv0vX6v/+/8/p97G6Xv/X7/W5Xv8/3p9Xky5p/zcJ+H96fP9Pe9yH+795fK/vO72fV5MupenP7+9jfX1/Xf83CdDXr0vXd9/vXv++pP69Wl1K+/+9pEvp5X99vX6v/7v/f5UAff3/C8X368Pr8+pS3Xv/u19NupSe/v/m8T29/O+v1+/1uV7/Nwn4f2p+P66f6+N5fS9p/L+XvP/Xv9P/vUvdfK9X/78f1/9NAv6fXv77+vD6vF7fP97fS3X/v/fXpEvp5X99vX6v/7v/f5UAff36fGpfX/++9P7//6S69P7/VdL/v0vdfK+v+6v/XyVA99f38vB8fV6v7zt9/68u3X//XpPu//d7/X+/v77ur+7/NwnQpbpU17u/7u3/JgHe/U8oqXf/E0rXv9un9//6e993uuv6v73+76/v7zM9+uha/f/vP/6H79f/Xyf959L9P6m6dP+ve/u/ScD9fTrpUl3v/rq3/5sEePc/oaTe/U8oXf9un97/6+993+mu6//2+r+/vr/P9Oij6+X9f9Kff/+fXv/+6X8K+u8T/fP+/8v6v1B9//9v9v/9+3X//X9f9/f1/v+rvUeA9rXv6/v+f1/39/W5Pp7X9/LwfH1er+87ve9f769f37+Xh+f19Xf/U9A/5/0TfW6f63M97uP5fX0830vX6v/v/fXr8710Xf/+fwn4T8X78+rS9X9vX99v5vH99df38/B8fd8/3t+LOnm9Ptcn7e93v3n/m/fXpAz/f78/v79Pf366RL/9/j9X29r+/v69v379f1df/+/X+VupQ6Xfp/6un/P9Pn8vpevlbf/1Kd7On//9L6e87fX+r//X73+L7Te69f1/f1vb6/v79P9//u5eX9v1SXu/Xf/69fV5cu1en/O70v6X96X6rL3fr7p3Xp/p909fS/+3+pf+789f26Ptf7+5cu9fUupv9/y/1//f0//v7vX/9f7/f9f3/9v9v9vVf8fWf/3/P//AXH9+qfX9Xre/T7v7/V5Ppf7eH4v9/+999f1+v8/D9fne3m/f9fr8/teXv6X1/cuve6v/39S/Xv6n/7vXvr/7fX+pUv9v//X/9vV/9vT/28u9f8z/f8v9f9T/X+XfP8z9f/f7P+f6v9f6v9fWf8Pmf9/dfX/8fq/5/+v+f/n9f/X9P839f839P9v9f838v//N6v/v9f/v7L+HzL///r6/0j9f8z8X/f6f6/6f7/6f//6f//6f//6f/8Bf2YVp6v1LdYAAAAASUVORK5CYII=',
    data: {
      url: '/'
    }
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Standard Push listener for non-Firebase or fallback
self.addEventListener('push', (event) => {
  console.log('[sw.js] Push event received', event);
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Smart Salon', body: event.data.text() };
    }
  }

  const title = data.title || 'Smart Salon';
  const options = {
    body: data.body || 'আপনার একটি নতুন আপডেট আছে।',
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AMQCisSBy88ygAAGXNJREFUeNrtXFtsFNcZ/s6Z2fX6An7AxmCInSZXS9pKaZpWpS99oU8N8pS0D02lSjt96EPUt6pS2qrUPlSVSvWhqu0DbeXhS6X2oWoaC60UVYmSAnYIdgx2fMGv9Xp3Z87pQ87urms767V7Z73reP5IsuecmfOf73z/+f//nP8M6K9+PZ6V0fUu6C96Cej0EtDpJaDTS0Cn/7fH9Oofj8f37dvH9PT0MD09TbXWv997Ym7at28f09PTzDT77B/L0UfX6pXp87k9PT1mZmaGmY8++sd09NG1enm9mZ9+87D56V6Z+Z9//ofv9H++T3Xp6P8XAnS9C/qLXgI6vQR0egno9BLQ6f+N6eU5vTAnF8f0wpzc4zM9+uha/X297P8pArS3B8D992f02V6Z3Sszv7Y7B+7v00mX6vK679Vl+n9LQP/vY3p5Ti/M939uX993v7b/e79OulSXuulSXe/+uL/+WwS0t9f776/m79f29YF7dfLfv96lk9/tX/79/6/X/1cC7u/TSZfqUvfv/+H/C8Vw89V7P79XJ/+98H7tfF9fp/v7dNIl7f86AdS53v9X/89f6v/m8f0/v78mXUq778f08v9nBPSBv/hS7/+H+/Nq0qW6dP8/IaAOfD8fF97X99dfn5uH5uUu1fXur3v7v0mApq9f//W5vP69vF9fv0vX6v/+/8/p97G6Xv/X7/W5Xv8/3p9Xky5p/zcJ+H96fP9Pe9yH+795fK/vO72fV5MupenP7+9jfX1/Xf83CdDXr0vXd9/vXv++pP69Wl1K+/+9pEvp5X99vX6v/7v/f5UAff3/C8X368Pr8+pS3Xv/u19NupSe/v/m8T29/O+v1+/1uV7/Nwn4f2p+P66f6+N5fS9p/L+XvP/Xv9P/vUvdfK9X/78f1/9NAv6fXv77+vD6vF7fP97fS3X/v/fXpEvp5X99vX6v/7v/f5UAff36fGpfX/++9P7//6S69P7/VdL/v0vdfK+v+6v/XyVA99f38vB8fV6v7zt9/68u3X//XpPu//d7/X+/v77ur+7/NwnQpbpU17u/7u3/JgHe/U8oqXf/E0rXv9un9//6e993uuv6v73+76/v7zM9+uha/f/vP/6H79f/Xyf959L9P6m6dP+ve/u/ScD9fTrpUl3v/rq3/5sEePc/oaTe/U8oXf9un97/6+993+mu6//2+r+/vr/P9Oij6+X9f9Kff/+fXv/+6X8K+u8T/fP+/8v6v1B9//9v9v/9+3X//X9f9/f1/v+rvUeA9rXv6/v+f1/39/W5Pp7X9/LwfH1er+87ve9f769f37+Xh+f19Xf/U9A/5/0TfW6f63M97uP5fX0830vX6v/v/fXr8710Xf/+fwn4T8X78+rS9X9vX99v5vH99df38/B8fd8/3t+LOnm9Ptcn7e93v3n/m/fXpAz/f78/v79Pf366RL/9/j9X29r+/v69v379f1df/+/X+VupQ6Xfp/6un/P9Pn8vpevlbf/1Kd7On//9L6e87fX+r//X73+L7Te69f1/f1vb6/v79P9//u5eX9v1SXu/Xf/69fV5cu1en/O70v6X96X6rL3fr7p3Xp/p909fS/+3+pf+789f26Ptf7+5cu9fUupv9/y/1//f0//v7vX/9f7/f9f3/9v9v9vVf8fWf/3/P//AXH9+qfX9Xre/T7v7/V5Ppf7eH4v9/+999f1+v8/D9fne3m/f9fr8/teXv6X1/cuve6v/39S/Xv6n/7vXvr/7fX+pUv9v//X/9vV/9vT/28u9f8z/f8v9f9T/X+XfP8z9f/f7P+f6v9f6v9fWf8Pmf9/dfX/8fq/5/+v+f/n9f/X9P839f839P9v9f838v//N6v/v9f/v7L+HzL///r6/0j9f8z8X/f6f6/6f7/6f//6f//6f//6f/8Bf2YVp6v1LdYAAAAASUVORK5CYII=',
    badge: 'data:image/png;base64,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',
    data: { url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[sw.js] Pre-caching mobile assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[sw.js] Clearing legacy cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
        }).catch(() => {});
        return cachedResponse;
      }
      
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  console.log('[sw.js] Mobile background sync triggered');
}
