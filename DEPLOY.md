# Fumi-Mate Deployment Guide

## Project Structure

```
fumi-mate-project/
├── fumi-mate-api/         # Flask Backend API
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── models/       # Database models
│   │   ├── routes/       # Route handlers
│   │   └── utils/        # Utilities
│   ├── migrations/       # Alembic migrations
│   └── run.py           # Application entry point
│
└── fumi-mate-nextjs/     # Next.js Frontend
    ├── app/              # Next.js pages
    ├── lib/              # Libraries and configs
    └── components/       # React components
```

---

## Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL or MySQL database
- PM2 (for process management) or systemd

---

## Environment Variables

### Backend (.env)
```
FLASK_APP=run.py
FLASK_ENV=production
DATABASE_URL=postgresql://user:password@localhost:5432/fumi_mate
JWT_SECRET_KEY=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Local Development Setup

### 1. Clone and Setup Backend

```bash
cd fumi-mate-api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Run seed data (optional)
python seed.py

# Start development server
python run.py
```

### 2. Setup Frontend

```bash
cd fumi-mate-nextjs

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Run development server
npm run dev
```

---

## Deployment to Production Server

### Backend Deployment

#### Option 1: Using Gunicorn + Systemd

```bash
# 1. Upload code to server
cd /var/www/fumi-mate-api

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
cp .env.example .env
nano .env  # Edit with production values

# 5. Run migrations
flask db upgrade

# 6. Create systemd service
sudo nano /etc/systemd/system/fumi-mate-api.service
```

Content of `fumi-mate-api.service`:
```ini
[Unit]
Description=Fumi-Mate API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/fumi-mate-api
Environment="PATH=/var/www/fumi-mate-api/venv/bin"
ExecStart=/var/www/fumi-mate-api/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 "run:app"
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 7. Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable fumi-mate-api
sudo systemctl start fumi-mate-api

# Check status
sudo systemctl status fumi-mate-api
```

#### Option 2: Using PM2

```bash
# Install PM2
npm install -g pm2

# Start the application
cd /var/www/fumi-mate-api
source venv/bin/activate
pm2 start "gunicorn -w 4 -b 127.0.0.1:5000 run:app" --name fumi-mate-api

# Setup auto-restart on reboot
pm2 save
pm2 startup
```

---

### Frontend Deployment

#### Option 1: Static Export

```bash
cd fumi-mate-nextjs

# Create production environment
echo "NEXT_PUBLIC_API_URL=https://api.yourdomain.com" > .env.production

# Build static files
npm run build

# Output is in .next/ directory
# Deploy to any static hosting (Vercel, Netlify, S3, etc.)
```

#### Option 2: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option 3: Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/.next /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Database Migrations

### Create New Migration (After Model Changes)

```bash
cd fumi-mate-api
source venv/bin/activate
flask db migrate -m "Description of changes"
```

### Apply Migrations

```bash
cd fumi-mate-api
source venv/bin/activate
flask db upgrade
```

### Rollback (if needed)

```bash
cd fumi-mate-api
source venv/bin/activate
flask db downgrade
```

### Check Status

```bash
flask db current
flask db history
```

---

## Deployment Checklist

### Before Deploying
- [ ] Test migrations locally (`flask db upgrade`)
- [ ] Build frontend (`npm run build`)
- [ ] Test API endpoints
- [ ] Backup database

### Deploy Steps
1. Pull latest code on server
2. Install/update dependencies
3. Run migrations: `flask db upgrade`
4. Restart backend service
5. Build and deploy frontend
6. Verify all endpoints work

### After Deploying
- [ ] Check API health endpoint
- [ ] Test login flow
- [ ] Test task creation
- [ ] Test student submission
- [ ] Check logs for errors

---

## Troubleshooting

### View Logs

```bash
# Systemd
sudo journalctl -u fumi-mate-api -f

# PM2
pm2 logs fumi-mate-api

# Direct
tail -f /var/log/fumi-mate-api.log
```

### Common Issues

1. **Migration fails**: Check database connection in `.env`
2. **Import errors**: Ensure virtual environment is activated
3. **Static files 404**: Rebuild frontend with correct API URL
4. **CORS errors**: Check CORS configuration in `app/__init__.py`

---

## Quick Deploy Script

Create `deploy.sh`:

```bash
#!/bin/bash

echo "=== Fumi-Mate Deploy ==="

# Backend
echo "Deploying backend..."
cd /var/www/fumi-mate-api
git pull
source venv/bin/activate
pip install -r requirements.txt
flask db upgrade
sudo systemctl restart fumi-mate-api

# Frontend
echo "Deploying frontend..."
cd /var/www/fumi-mate-nextjs
git pull
npm install
npm run build

echo "=== Deploy Complete ==="
```

Make it executable: `chmod +x deploy.sh`

---

## Support

For issues, check:
1. Backend logs: `sudo journalctl -u fumi-mate-api`
2. Database migrations: `flask db history`
3. API health: `GET /api/`

