# Railway Deployment Guide

## 🚀 Quick Setup

### 1. Connect to Railway

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub repo
3. Select your repository

### 2. Add PostgreSQL Database

1. Click "New Service" → "Database" → "PostgreSQL"
2. Railway will create a PostgreSQL database
3. Copy the connection URL from the "Connect" tab

### 3. Set Environment Variables

In your Railway project settings, add these variables:

```bash
# Database (Railway PostgreSQL)
DATABASE_URL="postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET_NAME="your-s3-bucket-name"

# Frontend URL (for CORS)
FRONTEND_URL="https://your-frontend-domain.com"

# Server
NODE_ENV="production"
```

### 4. Configure Build Settings

Railway will automatically detect this is a Node.js project. The build process will:

1. Install dependencies
2. Run `npm run postinstall` (generates Prisma client)
3. Build the application with `npm run build:prod`
4. Start with `npm run start:prod`

### 5. Run Database Migrations

After deployment, run migrations using Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link to project
railway login
railway link

# Run migrations
railway run npm run db:migrate
```

Or use Railway dashboard terminal:

```bash
npm run db:migrate
```

## 📁 File Structure

```
apps/api/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/                       # Source code
├── package.json               # Dependencies and scripts
├── Procfile                   # Heroku deployment (if needed)
└── env.example               # Environment variables template
```

## 🔧 Available Scripts

- `npm run build:prod` - Build for production
- `npm run start:prod` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio

## 🌐 Your API URL

After deployment, your API will be available at:
`https://your-app-name.railway.app/api`

## 🐛 Troubleshooting

### Prisma Schema Not Found

If you get schema not found errors, make sure:

1. The `prisma` field in package.json points to the correct schema
2. All Prisma commands use `--schema=./prisma/schema.prisma`

### Database Connection Issues

1. Check that `DATABASE_URL` is set correctly
2. Ensure the Railway PostgreSQL service is running
3. Run `npm run db:migrate` to set up the database schema

### Build Failures

1. Check that all dependencies are in package.json
2. Ensure the build script is correct
3. Check Railway logs for specific error messages
