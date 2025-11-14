// Central route registration
// Export a function that accepts the Express app and mounts route modules.
module.exports = function setupRoutes(app) {
  const geminiRoute = require('./routes/geminiRoute');
  const authRoutes = require('./routes/authRoutes');
  const userRoutes = require('./routes/userRoutes');
  const projectRoutes = require('./routes/projectRoutes');

  app.use('/gemini', geminiRoute);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/projects', projectRoutes);

  // Future routes can be added here, for example:
  // const otherRoute = require('./otherRoute');
  // app.use('/other', otherRoute);
};
