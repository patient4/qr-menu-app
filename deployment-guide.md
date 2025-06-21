# Production Deployment Guide - Icy Spicy Tadka

## Quick Deploy on Replit

1. **Enable Deployments:**
   - Go to your Replit dashboard
   - Click "Deploy" button in the top navigation
   - Choose "Autoscale Deployment" for handling 100+ orders
   - Click "Deploy"

2. **Your Live URL will be:**
   ```
   https://your-repl-name.your-username.replit.app
   ```

3. **QR Code URLs will automatically update to:**
   ```
   https://your-repl-name.your-username.replit.app/customer?restaurant=1&table=1
   https://your-repl-name.your-username.replit.app/customer?restaurant=1&table=2
   ```

## Security & Production Readiness

### Environment Variables (Already Configured)
- `DATABASE_URL` - PostgreSQL connection (secured)
- `NODE_ENV=production` - Automatically set in deployment

### Performance Optimizations (Implemented)
- Request body size limits increased for image uploads
- Efficient WebSocket connections for real-time updates
- Optimized queries with caching for 100+ orders
- Virtual scrolling for large order lists

### Security Features
- CORS configured for production domains
- Request validation with Zod schemas
- SQL injection protection via Drizzle ORM
- Image compression to prevent large uploads

## Post-Deployment Setup

1. **Generate QR Codes:**
   - Access: `https://your-live-url/admin`
   - Go to "QR Codes" tab
   - Generate codes for your tables
   - Download and print for table placement

2. **Test Multi-Table Ordering:**
   - Open multiple browser tabs with different table numbers
   - Place simultaneous orders to test capacity
   - Monitor admin dashboard for real-time updates

3. **Customer Access Points:**
   - Table QR codes (recommended)
   - Direct URL sharing: `https://your-live-url/customer?table=X`
   - Portal access: `https://your-live-url/portal`

## Scaling for High Volume

### Automatic Scaling (Replit Autoscale)
- Handles traffic spikes automatically
- Scales based on CPU/memory usage
- No manual intervention required

### Database Optimization
- Connection pooling configured
- Efficient indexing for order queries
- Automatic cleanup of old data

### Real-time Performance
- WebSocket connections optimized
- Batch order updates for efficiency
- Memory-efficient status tracking

## Monitoring & Maintenance

### Health Checks
- Automatic uptime monitoring
- Database connection verification
- WebSocket health checks

### Data Backup
- PostgreSQL automatic backups
- Order history preservation
- Menu data redundancy

## Production URLs Structure

```
Main Application: https://your-app.replit.app
Customer Ordering: https://your-app.replit.app/customer?table=X
Admin Dashboard: https://your-app.replit.app/admin
Restaurant Portal: https://your-app.replit.app/portal
Super Admin: https://your-app.replit.app/super-admin
```

## Support & Troubleshooting

### Common Issues
1. **QR Code Not Working**: Verify deployment URL is correct
2. **Orders Not Updating**: Check WebSocket connection
3. **Image Upload Issues**: Verify file size under 1MB
4. **Performance Lag**: Monitor active connections in admin

### Performance Metrics
- Target: <2s page load time
- Capacity: 100+ simultaneous orders
- Uptime: 99.9% availability
- Real-time: <500ms WebSocket updates