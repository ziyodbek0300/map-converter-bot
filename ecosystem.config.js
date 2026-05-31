// PM2 process configuration.
// Start with:  pm2 start ecosystem.config.js
//
// Reads .env itself (works on any Node version) and passes the vars to the
// app, so we don't depend on Node's --env-file flag.
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const file = path.join(__dirname, '.env');
  const env = {};
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  }
  return env;
}

module.exports = {
  apps: [
    {
      name: 'map-converter',
      script: 'dist/index.js',
      instances: 1, // a Telegram long-polling bot must be a single instance
      autorestart: true,
      max_restarts: 10,
      // Restart if the process balloons past this (catches leaks).
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        ...loadEnv(),
      },
    },
  ],
};
