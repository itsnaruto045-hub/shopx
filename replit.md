# Ebon Shop

## Overview

Ebon Shop is a digital marketplace application with a dark/minimal aesthetic theme. It provides a credit-based purchasing system where users can buy digital items with instant or sequential delivery. The platform includes user authentication, admin management capabilities, a ticket-based support system, and redeemable voucher codes for credits.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript using Vite as the build tool
- **Routing**: React Router DOM v7 with HashRouter for client-side navigation
- **Styling**: Tailwind CSS (loaded via CDN) with custom dark theme, glow effects, and smooth transitions
- **Icons**: Lucide React for consistent iconography
- **State Management**: Local component state with useState/useEffect hooks; user session persisted in localStorage under `ebon_shop_user` key

### Backend Architecture
- **Server**: Express.js running on port 5000
- **Database**: PostgreSQL via the `pg` driver with a connection pool
- **Authentication**: JWT-based authentication with bcrypt password hashing; tokens stored in httpOnly cookies
- **API Structure**: RESTful endpoints organized under `/api/auth`, `/api/items`, and `/api/tickets`

### Data Models
The PostgreSQL schema includes:
- **users**: id, username, password (hashed), role (ADMIN/USER), credits, created_at
- **items**: id, name, description, price, type (INSTANT/SEQUENTIAL), content, logo_url, created_at
- **purchases**: Links users to purchased items with delivered content
- **tickets/ticket_messages**: Support ticket system with threaded messages
- **redeem_codes**: Voucher codes that grant credits

### Authentication Flow
1. First registered user automatically receives ADMIN role
2. Passwords hashed with bcrypt before storage
3. JWT tokens issued on login with 24-hour expiration
4. Token stored in httpOnly cookie for security

### Core Features
- **Item Types**: Instant delivery (single content) and Sequential delivery (ordered content pages delivered one at a time)
- **Credit System**: Users purchase items using credits; can redeem voucher codes for more credits
- **Ticket System**: Users create support tickets; admins can respond and close tickets
- **Admin Panel**: Manage items, users, billing transactions, redeem codes, and tickets

### Build Configuration
- Vite configured to run dev server on port 3000
- Server serves built static files from `dist/` directory
- SPA routing handled by serving index.html for unknown routes

## External Dependencies

### Database
- **PostgreSQL**: Primary data store accessed via `pg` driver with connection pooling
- Connection string provided via `DATABASE_URL` environment variable
- SSL enabled with `rejectUnauthorized: false` for cloud database compatibility

### Authentication Libraries
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token generation and verification
- Session secret configured via `SESSION_SECRET` environment variable

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for JWT signing (falls back to 'fallback_secret')
future AI features)

### Frontend CDN Dependencies
- Tailwind CSS loaded via CDN (`https://cdn.tailwindcss.com`)
- Google Fonts (Inter font family)