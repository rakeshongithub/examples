// Define the default configuration
let environment = {
  name: 'local', // Name of the environment
  production: false, // Flag indicating whether this is a production environment
  apiUrl: 'http://localhost:3000', // Base URL for the API
  defaultLocale: 'en-us', // Default locale for the application
  supportedLocales: 'es,jp', // Supported locales for the application
  dbBaseUrl: 'http://localhost:1433', // Base URL for the database
  loggingLevels: 'info,error,warn', // Logging levels for the application
  showHeader: false // Flag indicating whether to show the header
};

// Start with the default configuration
let envConfig = { ...environment };

try {
  // If the BUILD_ENV environment variable is set, try to load the corresponding configuration file
  const configs = process.env.REACT_APP_ENV
    ? require(`./environment.${process.env.REACT_APP_ENV}.js`).default
    : {};

  // Merge the default configuration with the environment-specific configuration
  envConfig = {
    ...environment,
    ...configs
  };
} catch (e) {
  // If an error occurs (e.g., the configuration file doesn't exist), continue with the default configuration
  envConfig = environment;
}

// Export the configuration so it can be used in other parts of the application
module.exports = envConfig;