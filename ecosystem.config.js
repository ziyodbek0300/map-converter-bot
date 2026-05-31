// PM2 process configuration.
// Start with:  pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'map-converter',
      script: 'dist/index.js',
      // Load BOT_TOKEN (and any other vars) from .env, like the npm scripts do.
      node_args: '--env-file-if-exists=.env',
      instances: 1, // a Telegram long-polling bot must be a single instance
      autorestart: true,
      max_restarts: 10,
      // Restart if the process balloons past this (catches leaks).
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
