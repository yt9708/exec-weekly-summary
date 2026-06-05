module.exports = {
  apps: [{
    name: 'weekly-report',
    script: 'app.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3457
    },
    // 日志配置
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    // 自动重启
    max_restarts: 10,
    restart_delay: 5000,
    // 内存限制（超过则自动重启）
    max_memory_restart: '500M',
    // 优雅关闭
    kill_timeout: 5000
  }]
};
