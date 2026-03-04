module.exports = {
  apps: [
    {
      name: 'memory',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/memory',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
