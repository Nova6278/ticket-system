# BusMaster — Cloud-Based Bus Ticket Booking System

A full-stack online bus ticket booking system built for cloud deployment with high traffic handling.

## Features
- User registration and login with JWT authentication
- Browse available bus routes
- Real-time seat selection with anti-double-booking (Redis locking)
- Secure payments via Stripe
- Tamper-proof ticket generation with HMAC signing
- Auto-scaling on AWS for high traffic handling

## Tech Stack
**Backend:** Node.js, Express, TypeScript, PostgreSQL, Redis, Stripe  
**Frontend:** Next.js, TypeScript, Tailwind CSS, Zustand  
**Cloud:** AWS ECS Fargate, RDS, ElastiCache, ECR, Auto Scaling  
**DevOps:** Docker, GitHub Actions CI/CD  

## Local Setup
1. Clone the repo
2. Run `docker-compose up -d` to start Postgres and Redis
3. Add `.env` files as per `.env.example`
4. Run `npm run dev` in `apps/api` and `apps/web`
