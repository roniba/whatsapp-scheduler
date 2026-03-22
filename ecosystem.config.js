module.exports = {
  apps: [
    {
      name: 'whatsapp-scheduler',
      script: './backend/dist/index.js',
      cwd: '/Users/roni/Claude Code/projects/whatsapp-scheduler',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
    },
  ],
};
