/** PM2 process file — keeps Sri Homoeo Care web server running continuously */
module.exports = {
  apps: [
    {
      name: "sri-homoeo-care",
      script: ".output/server/index.mjs",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      min_uptime: "10s",
      max_restarts: 20,
      restart_delay: 3000,
      exp_backoff_restart_delay: 1000,
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3000",
        HOST: "0.0.0.0",
      },
      // Optional: load env from file if your host supports it
      // env_file: ".env",
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
