# 🚀 Deployment Guide

This guide covers different deployment options for the Restaurant Ordering System.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Git

## Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/restaurant-ordering-system.git
cd restaurant-ordering-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/restaurant_db
SESSION_SECRET=your-super-secret-key-here
NODE_ENV=production
PORT=5000
```

## Local Development

1. **Set up PostgreSQL database**
```bash
# Create database
createdb restaurant_db

# Push schema
npm run db:push
```

2. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Production Deployment

### Option 1: Traditional Server Deployment

1. **Build the application**
```bash
npm run build
```

2. **Start production server**
```bash
npm start
```

3. **Set up reverse proxy (Nginx)**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Set up SSL with Let's Encrypt**
```bash
sudo certbot --nginx -d yourdomain.com
```

### Option 2: Docker Deployment

1. **Build and run with Docker Compose**
```bash
docker-compose up -d
```

2. **Run database migrations**
```bash
docker-compose exec app npm run db:push
```

### Option 3: Cloud Platform Deployment

#### Heroku
1. **Create Heroku app**
```bash
heroku create your-app-name
```

2. **Add PostgreSQL addon**
```bash
heroku addons:create heroku-postgresql:mini
```

3. **Set environment variables**
```bash
heroku config:set SESSION_SECRET=your-secret-key
heroku config:set NODE_ENV=production
```

4. **Deploy**
```bash
git push heroku main
```

#### DigitalOcean App Platform
1. Create new app on DigitalOcean
2. Connect GitHub repository
3. Add PostgreSQL database
4. Configure environment variables
5. Deploy

#### Railway
1. Connect GitHub repository to Railway
2. Add PostgreSQL plugin
3. Configure environment variables
4. Deploy automatically

## Database Setup

### PostgreSQL Configuration

1. **Create production database**
```sql
CREATE DATABASE restaurant_db;
CREATE USER restaurant_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE restaurant_db TO restaurant_user;
```

2. **Run migrations**
```bash
npm run db:push
```

3. **Create initial admin user**
The system creates a default admin user:
- Username: `admin`
- Password: `admin123`

**Important:** Change this password immediately in production!

## Environment Variables

### Required Variables
```env
DATABASE_URL=postgresql://user:pass@host:port/dbname
SESSION_SECRET=your-secret-session-key
```

### Optional Variables
```env
NODE_ENV=production
PORT=5000
UPLOAD_MAX_SIZE=10mb
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Performance Optimization

### Database Optimization
1. **Add database indexes**
```sql
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);
```

2. **Configure connection pooling**
```env
DATABASE_URL=postgresql://user:pass@host:port/dbname?sslmode=require&pool_timeout=30&pool_max_conns=20
```

### Application Optimization
1. **Enable gzip compression**
2. **Configure CDN for static assets**
3. **Implement Redis for session storage** (optional)

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong SESSION_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Database connection encryption
- [ ] Environment variable security

## Monitoring

### Health Checks
The application provides a health check endpoint:
```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### Logging
Logs are output to console. In production, consider:
- Log aggregation (ELK stack, Splunk)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)

## Backup Strategy

### Database Backups
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
```

### File Backups
- Uploaded images (if using local storage)
- Configuration files
- SSL certificates

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall settings

2. **Port already in use**
   - Change PORT environment variable
   - Kill existing processes

3. **File upload issues**
   - Check file permissions
   - Verify upload directory exists
   - Check file size limits

### Debugging
```bash
# Check application logs
docker-compose logs -f app

# Check database connectivity
psql $DATABASE_URL

# Monitor resource usage
htop
```

## Scaling

### Horizontal Scaling
1. Load balancer configuration
2. Multiple application instances
3. Database read replicas
4. CDN for static assets

### Vertical Scaling
1. Increase server resources
2. Database performance tuning
3. Memory optimization

## Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Create an issue on GitHub

---

**Security Note:** Always use strong passwords and keep your system updated!