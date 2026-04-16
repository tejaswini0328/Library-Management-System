# Library Management System

## Overview

A full-stack Library Management System with role-based access for admins and library members.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/library-app)
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (zod/v4), drizzle-zod
- **Auth**: JWT-based (jsonwebtoken + bcryptjs)
- **Charts**: Recharts
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Default Credentials

- Admin: admin@library.com / admin123
- User: alice@example.com / user123
- User: bob@example.com / user123

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Application Pages

### Admin Section
- `/admin/login` — Admin login
- `/admin/home` — Dashboard with stats and charts
- `/admin/books` — CRUD for books
- `/admin/movies` — CRUD for movies
- `/admin/memberships` — CRUD for memberships
- `/admin/reports` — Reports: active issues, overdue, pending requests

### User Section
- `/user/login` — User login/register
- `/user/home` — User dashboard
- `/user/books` — Browse available books
- `/user/search` — Search books and movies

### Transactions
- `/transactions` — Transaction history
- `/transactions/issue` — Issue a book/movie
- `/transactions/return` — Return items
- `/transactions/pay-fine` — Pay overdue fines

## Database Schema

- `users` — role: admin/user
- `books` — title, author, isbn, category, copies, status
- `movies` — title, director, genre, duration, copies, status
- `memberships` — userId, type (basic/premium/student), status, dates
- `transactions` — userId, itemType, itemId, status, dates, fines

## Fine Calculation

- $1.00 per day overdue
- Fine is calculated when item is returned after due date
- Users can pay fines via the Pay Fine page

## API Routes

- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register
- `GET /api/auth/me` — Current user
- `GET/POST /api/books` — List/create books
- `GET/PUT/DELETE /api/books/:id` — Book CRUD
- `GET/POST /api/movies` — List/create movies
- `GET/PUT/DELETE /api/movies/:id` — Movie CRUD
- `GET/POST /api/memberships` — List/create memberships
- `GET/PUT/DELETE /api/memberships/:id` — Membership CRUD
- `GET/POST /api/transactions` — List/create transactions
- `POST /api/transactions/:id/return` — Return item
- `POST /api/transactions/:id/pay-fine` — Pay fine
- `POST /api/transactions/:id/approve` — Approve pending request (admin)
- `GET /api/reports/summary` — Dashboard stats
- `GET /api/reports/active-issues` — Active issues
- `GET /api/reports/overdue` — Overdue returns
- `GET /api/reports/pending-requests` — Pending requests
- `GET /api/users` — List users (admin)
