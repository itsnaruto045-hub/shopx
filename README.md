# VPS Deployment Guide for Ebon Shop

To deploy Ebon Shop on a VPS (Ubuntu/Debian recommended), follow these steps:

## 1. Prerequisites
- Node.js (v20+)
- PostgreSQL Database
- Git
- PM2 (for process management)

## 2. Database Setup
Ensure you have a PostgreSQL database running and accessible. Create the database:
```sql
CREATE DATABASE ebon_shop;
```

## 3. Clone and Prepare
```bash
git clone <your-repo-url>
cd ebon-shop
npm install
```

## 4. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ebon_shop
SESSION_SECRET=your_secure_random_secret
PORT=5000
```

## 5. Build and Start
```bash
# Build frontend
npm run build

# Start server using PM2
npm install -g pm2
pm2 start xyy-main/server/index.ts --interpreter npx --interpreter-args tsx --name ebon-shop
```

## 6. Nginx Reverse Proxy (Recommended)
Configure Nginx to point to port 5000:
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
        proxy_cache_bypass $http_upgrade;
    }
}
```
