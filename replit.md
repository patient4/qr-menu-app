# Restaurant QR Menu & Ordering System

## Overview

This is a full-stack web application for "Icy Spicy Tadka", a pure-vegetarian restaurant. The system provides a QR-based digital menu ordering experience with two main interfaces: a mobile-first customer app for browsing and ordering, and an admin dashboard for order management and analytics.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern component-based UI with type safety
- **Vite**: Fast build tool and development server
- **Tailwind CSS + shadcn/ui**: Utility-first styling with pre-built component library
- **Wouter**: Lightweight client-side routing
- **TanStack Query**: Server state management and caching

### Backend Architecture
- **Express.js**: RESTful API server with middleware support
- **WebSocket**: Real-time communication for live order updates
- **In-memory storage**: Current implementation uses Map-based storage (designed to be easily replaceable with database)

### Database Design
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **Schema-first approach**: Centralized database schema in `shared/schema.ts`
- **Tables**: users, restaurants, menu_categories, menu_items, orders

## Key Components

### Data Models
- **Restaurant**: Configuration, branding, pricing (service charge, GST)
- **Menu System**: Categories and items with pricing, descriptions, dietary info
- **Order Management**: Full order lifecycle with status tracking
- **User Management**: Basic authentication system

### API Routes
- Restaurant configuration endpoints
- Menu management (categories and items)
- Order processing with status updates
- Real-time WebSocket connections for live updates
- Analytics and reporting endpoints

### UI Components
- **MenuCard**: Interactive menu item display with quantity controls
- **CartSidebar**: Shopping cart with order customization
- **OrderCard**: Order management interface for admin
- **Complete shadcn/ui component library**: Buttons, forms, dialogs, etc.

## Data Flow

1. **Customer Journey**:
   - Access via QR code with table parameter
   - Browse categorized menu items
   - Add items to cart with quantity selection
   - Place order with customer details
   - Receive order confirmation

2. **Admin Workflow**:
   - Monitor incoming orders in real-time
   - Update order status (pending → preparing → ready → completed)
   - View analytics dashboard with daily stats
   - Export reports and manage settings

3. **Real-time Updates**:
   - WebSocket broadcasts for new orders
   - Live status updates across all connected clients
   - Notification system for order state changes

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connection (Neon PostgreSQL)
- **drizzle-orm**: Database ORM with migrations
- **ws**: WebSocket server implementation
- **@tanstack/react-query**: Data fetching and caching
- **@radix-ui/***: Headless UI components for accessibility

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling
- **Replit integrations**: Runtime error overlay and cartographer

### Styling and UI
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

## Deployment Strategy

### Development Environment
- **Node.js 20**: Runtime environment
- **PostgreSQL 16**: Database system
- **Replit-optimized**: Native integration with Replit platform

### Build Process
- **Development**: `npm run dev` - Hot reload with tsx
- **Production Build**: `npm run build` - Vite frontend + esbuild backend
- **Database**: `npm run db:push` - Drizzle schema deployment

### Configuration Management
- **Restaurant config**: JSON-based configuration in `client/src/config/restaurant.json`
- **Environment variables**: DATABASE_URL for database connection
- **Feature flags**: Subscription and trial management

### Deployment Target
- **Replit Autoscale**: Configured for automatic scaling
- **Static assets**: Served from `dist/public`
- **API endpoints**: Express server with `/api` prefix

## Changelog
- June 21, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.