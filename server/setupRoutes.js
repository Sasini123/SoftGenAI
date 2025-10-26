// Central route registration
// Export a function that accepts the Express app and mounts route modules.
module.exports = function setupRoutes(app) {
  // Import route modules here and mount them on paths
  const geminiRoute = require('./routes/geminiRoute');
  app.use('/gemini', geminiRoute);

  // Future routes can be added here, for example:
  // const otherRoute = require('./otherRoute');
  // app.use('/other', otherRoute);
};
