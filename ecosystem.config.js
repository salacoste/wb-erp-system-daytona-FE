/**
 * PM2 Ecosystem Configuration for WB Repricer Frontend
 * IMPORTANT: Only ONE instance should run at a time (Dev OR Production)
 * Both use port 3100 - never run both simultaneously
 *
 * Usage (switch between Dev and Production):
 * - To run DEV:     ./pm2-switch-dev.sh
 * - To run PROD:    ./pm2-switch-prod.sh
 *
 * Or manually:
 * - Development: pm2 stop wb-repricer-frontend && pm2 start ecosystem.config.js --only wb-repricer-frontend-dev
 * - Production:  pm2 stop wb-repricer-frontend-dev && npm run build && pm2 start ecosystem.config.js --only wb-repricer-frontend --env production
 */
module.exports = {
  apps: [
    {
      name: 'wb-repricer-frontend-dev',
      // Development: use 'npm run dev' (no build required, hot reload, no caching)
      script: 'npm',
      args: 'run dev',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      // Development configuration
      env: {
        NODE_ENV: 'development',
        PORT: 3100,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      error_file: './logs/pm2-dev-error.log',
      out_file: './logs/pm2-dev-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Prevent restart loops on port conflicts (CRITICAL FIX)
      autorestart: true,
      max_restarts: 5,              // Reduce from 10 to prevent excessive restarts
      min_uptime: '30s',            // Increase from 10s to ensure stable startup
      restart_delay: 5000,          // 5s delay between restarts
      exp_backoff_restart_delay: 100, // Exponential backoff for failed restarts
      watch: false,
      kill_timeout: 5000,           // 5s timeout for graceful shutdown
    },
    {
      name: 'wb-repricer-frontend',
      // Production: use 'next start' (requires build first, with caching)
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: process.cwd(),
      instances: 1,
      exec_mode: 'fork',
      // Production configuration
      env_production: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
      error_file: './logs/pm2-prod-error.log',
      out_file: './logs/pm2-prod-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Prevent restart loops
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,
      watch: false,
      kill_timeout: 5000,
    },
  ],
};
