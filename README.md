# eLearning Monorepo

## Introduction

This is a full-stack eLearning platform built as a monorepo using Nx. The application provides a modern online learning experience for students and teachers, including:

- User authentication (students and teachers)
- Class and lesson management
- PDF and video content upload for lessons
- Assessments and submissions
- Real-time notifications
- Profile management with image upload

The backend is built with NestJS, Prisma, and PostgreSQL, and uses AWS S3 for file storage. The frontend is built with Next.js and React, styled with Tailwind CSS, and uses React Query for data fetching.

---

## Running Locally

### Prerequisites

- Node.js (v18 or later recommended)
- npm (v9 or later)
- PostgreSQL database (local or cloud)
- AWS S3 bucket and credentials (for file uploads)

### 1. Clone the repository

```sh
git clone <your-repo-url>
cd elearning-monerepo
```

### 2. Install dependencies

```sh
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root and add the following (replace with your values):

```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
AWS_REGION=<your-aws-region>
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_S3_BUCKET_NAME=<your-bucket-name>
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Set up the database

Run Prisma migrations to set up the database schema:

```sh
npx nx run api:prisma-migrate-deploy
```

### 5. Start the backend (NestJS API)

```sh
npx nx serve api
```

The API will run on [http://localhost:3000](http://localhost:3000)

### 6. Start the frontend (Next.js client)

In a new terminal:

```sh
npx nx dev client
```

The frontend will run on [http://localhost:4200](http://localhost:4200)

---
