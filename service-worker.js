// service-worker.js
const CACHE_NAME = 'readmedia-v1';
const API_CACHE_NAME = 'readmedia-api-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/articles.html',
  '/books.html',
  '/reviews.html',
  '/recommendations.html',
  '/donate.html', // Now this exists!
  '/css/styles.css',
  '/css/articles.css',
  '/css/donate.css',
  '/js/script.js',
  '/js/articles.js',
  '/js/donate.js',
  '/manifest.json'
];

// API endpoints to cache
const API_ENDPOINTS = [
    '/data/articles.json',
    '/data/books.json',
    '/data/reviews.json',
    '/data/amazon-recommendations.json',
    '/data/ads.json'
];

// External domains to skip caching
const EXTERNAL_DOMAINS = [
    'amazon-adsystem.com',
    'googleapis.com',
    'googletagmanager.com',
    'google-analytics.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                // Use individual cache adds instead of addAll to avoid failing on missing files
                const cachePromises = STATIC_ASSETS.map(asset => {
                    return cache.add(asset).catch(error => {
                        console.warn(`Failed to cache ${asset}:`, error);
                        // Continue even if some assets fail to cache
                        return Promise.resolve();
                    });
                });
                return Promise.all(cachePromises);
            })
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('Service Worker installation failed:', error);
                // Don't fail the installation if caching fails
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Helper function for fetch with timeout
function fetchWithTimeout(request, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Request timeout'));
        }, timeout);

        fetch(request)
            .then(response => {
                clearTimeout(timeoutId);
                resolve(response);
            })
            .catch(error => {
                clearTimeout(timeoutId);
                reject(error);
            });
    });
}

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and browser extensions
    if (request.method !== 'GET' || 
        url.protocol === 'chrome-extension:' || 
        url.href.includes('chrome-extension')) {
        return;
    }

    // Skip external domains (Amazon ads, analytics, etc.)
    const isExternalDomain = EXTERNAL_DOMAINS.some(domain => url.hostname.includes(domain));
    if (isExternalDomain) {
        // Let these requests go through without caching
        event.respondWith(fetchWithTimeout(request, 3000).catch(() => {
            // Return empty response for external resources that fail
            if (request.destination === 'script') {
                return new Response('', { headers: { 'Content-Type': 'application/javascript' } });
            }
            if (request.destination === 'style') {
                return new Response('', { headers: { 'Content-Type': 'text/css' } });
            }
            return new Response('', { status: 408 });
        }));
        return;
    }

    // API requests - Network First strategy
    if (API_ENDPOINTS.some(endpoint => url.pathname.endsWith(endpoint))) {
        event.respondWith(
            fetchWithTimeout(request, 8000) // 8 second timeout for API
                .then(response => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(API_CACHE_NAME)
                            .then(cache => cache.put(request, responseClone))
                            .catch(error => console.warn('API cache put failed:', error));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            return new Response(
                                JSON.stringify({ 
                                    message: 'You are offline',
                                    data: [] 
                                }),
                                { 
                                    headers: { 'Content-Type': 'application/json' } 
                                }
                            );
                        });
                })
        );
        return;
    }

    // HTML pages - Network First strategy
    if (request.headers.get('Accept')?.includes('text/html') || 
        request.mode === 'navigate') {
        event.respondWith(
            fetchWithTimeout(request, 5000) // 5 second timeout for pages
                .then(response => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, responseClone))
                            .catch(error => console.warn('HTML cache put failed:', error));
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache for navigation requests
                    return caches.match(request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Fallback to index.html for SPA-like behavior
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }

    // Static assets - Cache First strategy
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Update cache in background
                    event.waitUntil(
                        fetchWithTimeout(request, 3000)
                            .then(response => {
                                if (response.status === 200) {
                                    const responseClone = response.clone();
                                    caches.open(CACHE_NAME)
                                        .then(cache => cache.put(request, responseClone))
                                        .catch(error => console.warn('Background cache update failed:', error));
                                }
                            })
                            .catch(() => {
                                // Ignore background update failures
                            })
                    );
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetchWithTimeout(request, 3000)
                    .then(response => {
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(request, responseClone))
                                .catch(error => console.warn('Cache put failed:', error));
                        }
                        return response;
                    })
                    .catch(error => {
                        console.log('Fetch failed for:', request.url, error);
                        
                        // Return appropriate fallbacks based on request type
                        if (request.destination === 'image') {
                            return caches.match('/images/placeholder.jpg')
                                .then(placeholder => placeholder || new Response(''));
                        }
                        
                        if (request.destination === 'style') {
                            return new Response('', { 
                                headers: { 'Content-Type': 'text/css' } 
                            });
                        }
                        
                        if (request.destination === 'script') {
                            return new Response('', { 
                                headers: { 'Content-Type': 'application/javascript' } 
                            });
                        }
                        
                        return new Response('Network error', {
                            status: 408,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});

// Background sync for data updates
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Background sync triggered');
        event.waitUntil(
            syncData()
                .then(() => {
                    // Notify clients that data was updated
                    self.clients.matchAll().then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'CACHE_UPDATED',
                                message: 'Data synchronized in background'
                            });
                        });
                    });
                })
                .catch(error => {
                    console.error('Background sync failed:', error);
                })
        );
    }
});

// Push notifications (optional - can be removed if not needed)
self.addEventListener('push', event => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'ReadMedia',
            body: 'New content available!'
        };
    }

    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

// Helper function for background sync
async function syncData() {
    try {
        const cache = await caches.open(API_CACHE_NAME);
        
        for (const endpoint of API_ENDPOINTS) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    await cache.put(endpoint, response);
                }
            } catch (error) {
                console.warn(`Failed to sync ${endpoint}:`, error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
        throw error;
    }
}