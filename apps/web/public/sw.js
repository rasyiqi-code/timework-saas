const CACHE_NAME = 'timework-kbm-v1';

// Install event - cache core assets if needed, or just skip waiting
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Fetch event - simple Network-First strategy
// This ensures that we always get fresh content if online, matching the user's desire for stability
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip API requests and Next.js data - strict Network Only
    if (event.request.url.includes('/api/') || event.request.url.includes('/_next/data/')) {
        return;
    }

    // For other requests (pages, assets), try network first, then cache (optional fallback)
    // For 'Lightweight PWA', we might not even cache. 
    // Just having a fetch listener enables the "Add to Home Screen" prompt.

    // Minimal implementation: Pass through to network
    event.respondWith(
        fetch(event.request).catch(() => {
            // Optional: Return a custom offline page here if we had one cached
            // return caches.match('/offline');
            return new Response("You are offline.");
        })
    );
});
