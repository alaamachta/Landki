module.exports = {
  apps: [{
    name: 'interview-api',
    script: './start.sh',
    cwd: '/var/www/landki/interview/api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/var/www/landki/interview/_logs/api-error.log',
    out_file: '/var/www/landki/interview/_logs/api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
