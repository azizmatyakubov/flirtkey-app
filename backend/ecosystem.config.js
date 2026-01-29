/**
 * PM2 Configuration for FlirtKey API Proxy
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart flirtkey-api
 *   pm2 logs flirtkey-api
 *   pm2 stop flirtkey-api
 */
module.exports = {
  apps: [
    {
      name: 'flirtkey-api',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 4060,
        // Set these in your environment or .env file:
        // OPENAI_API_KEY: 'sk-...',
        // AUTH_SECRET: 'your-secure-secret',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4060,
      },
    },
  ],
};
