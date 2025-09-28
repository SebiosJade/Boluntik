# VolunTech Backend Deployment Guide

## 🚀 Production Deployment

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Database** (PostgreSQL or MongoDB)
3. **Redis** (for caching and sessions)
4. **PM2** (process manager)
5. **Nginx** (reverse proxy)

### 1. Environment Setup

Create a production environment file:

```bash
cp env.example .env.production
```

Update `.env.production` with your production values:

```env
NODE_ENV=production
PORT=4000

# JWT Configuration
JWT_SECRET=your-super-secure-production-secret
JWT_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/voluntech_prod
# or for MongoDB:
# MONGODB_URI=mongodb://localhost:27017/voluntech_prod

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=VolunTech <noreply@voluntech.com>

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/var/www/voluntech/uploads

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### 2. Database Setup

#### PostgreSQL Setup
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE voluntech_prod;
CREATE USER voluntech_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE voluntech_prod TO voluntech_user;
\q
```

#### MongoDB Setup
```bash
# Install MongoDB
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
use voluntech_prod
db.createUser({
  user: "voluntech_user",
  pwd: "secure_password",
  roles: ["readWrite"]
})
```

### 3. Application Deployment

```bash
# Clone repository
git clone https://github.com/your-username/voluntech.git
cd voluntech/Backend

# Install dependencies
npm install --production

# Create necessary directories
sudo mkdir -p /var/www/voluntech/uploads/avatars
sudo mkdir -p /var/www/voluntech/logs
sudo chown -R $USER:$USER /var/www/voluntech

# Run database migration
npm run migrate --database=postgresql
# or for MongoDB:
# npm run migrate --database=mongodb

# Test the application
npm test
```

### 4. Process Management with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'voluntech-backend',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. Nginx Configuration

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/voluntech
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API Routes
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # Health Check
    location /health {
        proxy_pass http://localhost:4000;
        access_log off;
    }

    # Static Files
    location /uploads/ {
        alias /var/www/voluntech/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend (if serving from same server)
    location / {
        root /var/www/voluntech/frontend/build;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# Rate limiting zones
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/voluntech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate Setup

#### Using Let's Encrypt (Certbot)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 7. Monitoring and Logging

#### Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/voluntech
```

```
/var/www/voluntech/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload voluntech-backend
    endscript
}
```

#### Setup Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 8. Backup Strategy

Create backup script:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/voluntech"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump voluntech_prod > $BACKUP_DIR/database_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/voluntech/uploads

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /var/www/voluntech/logs

# Keep only last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Make it executable and add to cron:

```bash
chmod +x backup.sh
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /path/to/backup.sh
```

### 9. Performance Optimization

#### Redis Setup for Caching
```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Update these settings:
maxmemory 256mb
maxmemory-policy allkeys-lru
```

#### Database Optimization
```sql
-- PostgreSQL optimization
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_events_organization_id ON events(organization_id);
CREATE INDEX CONCURRENTLY idx_event_participants_event_user ON event_participants(event_id, user_id);
```

### 10. Health Checks and Monitoring

Create health check script:

```bash
#!/bin/bash
# health-check.sh

HEALTH_URL="https://your-domain.com/health"
LOG_FILE="/var/log/voluntech-health.log"

# Check if service is responding
if curl -f -s $HEALTH_URL > /dev/null; then
    echo "$(date): Health check passed" >> $LOG_FILE
else
    echo "$(date): Health check failed - restarting service" >> $LOG_FILE
    pm2 restart voluntech-backend
fi
```

### 11. Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall (UFW)
- [ ] Configure fail2ban
- [ ] Regular security updates
- [ ] SSL/TLS encryption
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] File upload restrictions
- [ ] Database access restricted
- [ ] Log monitoring setup

### 12. Deployment Commands

```bash
# Deploy new version
git pull origin main
npm install --production
npm run migrate
pm2 reload voluntech-backend

# Rollback if needed
git checkout previous-commit
npm install --production
pm2 reload voluntech-backend

# View logs
pm2 logs voluntech-backend
tail -f /var/www/voluntech/logs/combined.log

# Monitor performance
pm2 monit
```

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   sudo lsof -i :4000
   sudo kill -9 <PID>
   ```

2. **Database connection issues**
   - Check database service status
   - Verify connection string
   - Check firewall rules

3. **Memory issues**
   ```bash
   # Increase Node.js memory limit
   node --max-old-space-size=2048 index.js
   ```

4. **SSL certificate issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew if needed
   sudo certbot renew
   ```

### Performance Monitoring

```bash
# Monitor system resources
htop
iotop
free -h
df -h

# Monitor application
pm2 monit
pm2 logs voluntech-backend --lines 100

# Database performance
# PostgreSQL
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# MongoDB
mongo --eval "db.serverStatus()"
```

This deployment guide provides a comprehensive setup for production deployment of your VolunTech backend with security, monitoring, and performance optimizations.
