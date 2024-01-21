/**
 * Listen for a service worker in a 'waiting' state.
 * @param {ServiceWorkerRegistration} reg - The service worker registration object.
 * @param {Function} callback - The callback function to run when the service worker is waiting.
 */
function listenForWaitingServiceWorker(reg, callback) {
    // If there's no registration, exit the function
    if (!reg) return;
  
    // If there's a service worker waiting, run the callback and exit the function
    if (reg.waiting) return callback(reg);
  
    // Define a function to add an event listener to the installing service worker
    const awaitStateChange = () => {
      // If there's a service worker installing
      if (reg.installing) {
        // Add an event listener for the 'statechange' event
        reg.installing.addEventListener('statechange', function () {
          // If the state changes to 'installed', run the callback
          if (this.state === 'installed') callback(reg);
        });
      }
    };
  
    // Add an event listener for the 'updatefound' event to run the awaitStateChange function
    reg.addEventListener('updatefound', awaitStateChange);
  
    // Run the awaitStateChange function
    awaitStateChange();
  }
  
  /**
   * Prompt the user to refresh the page when a new service worker is installed.
   * @param {ServiceWorkerRegistration} registration - The service worker registration object.
   */
  function promptUserToRefresh(registration) {
    // Log a message to the console indicating a new version is available
    console.log('=> New version available!');
  
    // Send a 'skipWaiting' message to the waiting service worker
    registration.waiting.postMessage('skipWaiting');
  
    // Log a message to the console indicating the new version has been activated
    console.log('=> New version activated.');
  }
  
  /**
   * Initialize the service worker.
   */
  const swInit = () => {
    // If service workers are supported in the browser
    if ('serviceWorker' in navigator) {
      // Register the service worker
      navigator.serviceWorker.register('/path/of/sw.js').then(
        (registration) => {
          // Log a message to the console indicating the registration was successful
          console.log('Service Worker registration successful with scope: ', registration.scope);
  
          // Add an event listener for the 'controllerchange' event to reload the page
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });
  
          // Listen for a waiting service worker and prompt the user to refresh the page when a new version is available
          listenForWaitingServiceWorker(registration, promptUserToRefresh);
        },
        (err) => {
          // Log a message to the console indicating the registration failed
          console.log('Service Worker registration failed: ', err);
        }
      );
    }
  };
  
  // Export the swInit function as the default export
  export default swInit;
  