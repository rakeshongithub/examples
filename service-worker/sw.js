// Declare the version of the cache
const version = 1;

// Declare the name of the cache, including the version
const blogApiCacheName = `api-cache-${version}`;

// Declare the name of the header for the service worker API fetch
const swHeaderName = 'x-sw-api-fetched-on';

// Declare the list of URLs to be cached
const reqUrls = ['/ap/v1/blogs', '/api/model.json'];

// Declare an array of whitelisted origins
const originArray = ['http://localhost:3000', 'https://www.yourdomain.com'];

/**
 * Check if a cached API response is still valid
 * @param  {Object}  response The response object
 * @return {Boolean}          If true, cached data is valid
 */
const isValidResponse = (response) => {
  // If there's no response, return false
  if (!response) return false;

  // Get the timestamp of when the data was fetched
  const fetched = response.headers.get(swHeaderName);

  // Return true if the data was fetched less than 2 hours ago, false otherwise
  return !!(fetched && parseFloat(fetched) + 1000 * 60 * 60 * 2 > new Date().getTime());
};

/**
 * Check if the request URL is included in the list of URLs to be cached
 * @param  {Object}  event The fetch event
 * @return {Boolean}       If true, the request URL is included in the list
 */
const isRequestUrlIncluded = (event) => {
  // Return true if the request URL is included in the list of URLs to be cached, false otherwise
  return reqUrls.some((url) => event.request.url.includes(url));
};

/**
 * Check if the origin is included in the list of whitelisted origins
 * @param  {String}  origin The origin
 * @return {Boolean}        If true, the origin is whitelisted
 */
const isOriginWhitelisted = (origin) => {
  // Return true if the origin is included in the list of whitelisted origins, false otherwise
  return originArray.includes(origin);
};

/**
 * Handle the install event
 * @param  {Object} event The install event
 */
const handleInstall = (event) => {
  // Log a message to the console indicating the version of the cache that is being installed
  console.log(`Version ${version} installed`);
};

/**
 * Handle the activate event
 * @param  {Object} event The activate event
 */
const handleActivate = (event) => {
  // Log a message to the console indicating the version of the cache that is being activated
  console.log(`version ${version} activated`);

  // Delete all old versions of the cache
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== blogApiCacheName).map((key) => caches.delete(key)))
    )
  );
};

/**
 * Handle the fetch event
 * @param  {Object} event The fetch event
 */
const handleFetch = (event) => {
  // If the request URL is not included in the list of URLs to be cached, exit the function
  if (!isRequestUrlIncluded(event)) return;

  // Log a message to the console indicating the request URL
  console.log(`FETCH: request for: ${event.request.url}`);

  // Respond with the cached response if it's valid, or fetch a fresh response if it's not
  event.respondWith(
    (async () => {
      // If the request is a navigation request and there's a service worker waiting, skip waiting and refresh the page
      if (
        event.request.mode === 'navigate' &&
        event.request.method === 'GET' &&
        registration.waiting &&
        (await clients.matchAll()).length < 2
      ) {
        // Send a 'skipWaiting' message to the waiting service worker
        registration.waiting.postMessage('skipWaiting');

        // Return a new response with a 'Refresh' header to refresh the page
        return new Response('', { headers: { Refresh: '0' } });
      }

      // Try to match the request with a cached response
      const cachedResponse = await caches.match(event.request);

      // If the cached response is valid
      if (isValidResponse(cachedResponse)) {
        // Log a message to the console indicating the cached data is valid
        console.log(`VALID CACHED DATA ${event.request.url}`);

        // Return the cached response
        return cachedResponse;
      }

      // Log a message to the console indicating the cache is missing
      console.log(`MISSING CACHE ${event.request.url}`);

      // Fetch a fresh response
      const response = await fetch(event.request);

      // Log a message to the console indicating a fresh call is being made
      console.log(`MAKING FRESH CALL ${event.request.url}`);
      console.log(`MAKING FRESH CALL RES => ${response}`);

      // Clone the response
      const copy = response.clone();

      // Open the cache
      event.waitUntil(
        caches.open(blogApiCacheName).then((cache) => {
          // Create a new headers object with the headers of the cloned response
          const headers = new Headers(copy.headers);

          // Append a 'x-sw-api-fetched-on' header with the current timestamp
          headers.append(swHeaderName, new Date().getTime());

          // Get the body of the cloned response
          return copy.blob().then((body) => {
            // If the status code of the response is not 200, exit the function
            if (response.status !== 200) {
              return;
            }

            // Put the cloned response in the cache
            return cache.put(
              event.request,
              new Response(body, {
                status: copy.status,
                statusText: copy.statusText,
                headers: headers,
              })
            );
          });
        })
      );

      // Return the fresh response
      return response;
    })()
  );
};

/**
 * Handle the message event
 * @param  {Object} messageEvent The message event
 */
const handleMessage = (messageEvent) => {
  // If the origin of the message is not included in the list of whitelisted origins, exit the function
  if (!isOriginWhitelisted(messageEvent.origin)) {
    return;
  }

  // If the data of the message is 'skipWaiting', skip waiting
  if (messageEvent.data === 'skipWaiting') return skipWaiting();
};

// Add an event listener for the 'install' event to handle the install event
self.addEventListener('install', handleInstall);

// Add an event listener for the 'activate' event to handle the activate event
self.addEventListener('activate', handleActivate);

// Add an event listener for the 'fetch' event to handle the fetch event
self.addEventListener('fetch', handleFetch);

// Add an event listener for the 'message' event to handle the message event
self.addEventListener('message', handleMessage);
