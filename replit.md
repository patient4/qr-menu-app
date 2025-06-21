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

## Recent Changes
- June 21, 2025: Enhanced restaurant schema with multi-restaurant support
- June 21, 2025: Added comprehensive product management system with photo upload
- June 21, 2025: Implemented subscription management with 30-day free trial
- June 21, 2025: Created admin dashboard with product editing capabilities
- June 21, 2025: Added restaurant management portal for multi-restaurant control
- June 21, 2025: Implemented admin notifications with sound alerts for new orders
- June 21, 2025: Created Today's Specials feature for weekend specials management
- June 21, 2025: Fixed eye button functionality in orders table with detailed order dialog
- June 21, 2025: Started Go backend implementation for performance optimization
- June 21, 2025: Added unit testing framework for order progress tracking
- June 21, 2025: Fixed WebSocket integration for real-time order status updates (eliminated delays)
- June 21, 2025: Enhanced customer satisfaction features with call waiter, feedback, and special requests
- June 21, 2025: Created comprehensive Super Admin portal for multi-restaurant management
- June 21, 2025: Added browser notifications, estimated cooking times, and real-time status alerts
- June 21, 2025: Fixed critical product add/edit functionality with proper API endpoints and comprehensive unit testing
- June 21, 2025: Implemented QR code generation system with downloadable table-specific codes
- June 21, 2025: Added performance optimizations for handling 100+ simultaneous orders
- June 21, 2025: Created production deployment configuration with security enhancements

## Production Deployment

### Deployment Status
Ready for production deployment with full security and performance optimizations.

### Key Features for Production
- QR code generation system for table-specific ordering links
- Performance optimization for 100+ simultaneous orders
- Real-time WebSocket updates with automatic reconnection
- Image compression and upload handling
- Multi-restaurant support with subscription management
- Comprehensive admin dashboard with analytics

### Security Features
- Request size limits and validation
- CORS configuration for production domains
- SQL injection protection via Drizzle ORM
- Environment-based configuration management

### Deployment Process
1. Click "Deploy" button in Replit
2. Choose "Autoscale Deployment" for high traffic handling
3. QR codes will automatically update to production URLs
4. Access admin panel to generate table QR codes

### Production URLs
- Main app: `https://your-repl-name.your-username.replit.app`
- Customer ordering: `https://your-repl-name.your-username.replit.app/customer?table=X`
- Admin dashboard: `https://your-repl-name.your-username.replit.app/admin`

## Changelog
- June 21, 2025: Initial setup
- June 21, 2025: Added multi-restaurant architecture with subscription management
- June 21, 2025: Completed comprehensive restaurant management system with portal, notifications, and specials
- June 21, 2025: Production-ready deployment configuration with QR code system

## User Preferences

Preferred communication style: Simple, everyday language.