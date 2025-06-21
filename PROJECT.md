# Restaurant Ordering System - Project Documentation

## Overview

A modern, full-stack QR-based restaurant ordering platform that enables seamless digital menu experiences for restaurants and customers. Built with React, TypeScript, Node.js, and PostgreSQL.

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
- **PostgreSQL**: Production database with Drizzle ORM
- **Session-based Authentication**: Secure user management

### Database Design
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Schema-first approach**: Centralized database schema in `shared/schema.ts`
- **Tables**: users, restaurants, menu_categories, menu_items, orders, otp_verifications

## Key Components

### Data Models
- **Restaurant**: Configuration, branding, pricing (service charge, GST)
- **Menu System**: Categories and items with pricing, descriptions, dietary info
- **Order Management**: Full order lifecycle with status tracking
- **User Management**: Role-based authentication system
- **Subscription Management**: Multi-restaurant platform with access controls

### API Routes
- Restaurant configuration endpoints
- Menu management (categories and items)
- Order processing with status updates
- Real-time WebSocket connections for live updates
- Analytics and reporting endpoints
- Super admin platform management

### UI Components
- **MenuCard**: Interactive menu item display with quantity controls
- **CartSidebar**: Shopping cart with order customization
- **OrderCard**: Order management interface for admin
- **Complete shadcn/ui component library**: Buttons, forms, dialogs, etc.

## Data Flow

1. **Customer Journey**:
   - Access via QR code with table parameter
   - Simple name entry for personalized experience
   - Browse categorized menu items
   - Add items to cart with quantity selection
   - Place order with customer details
   - Real-time order tracking with status updates

2. **Admin Workflow**:
   - Monitor incoming orders in real-time
   - Update order status (pending → preparing → ready → completed)
   - View analytics dashboard with daily stats
   - Manage menu items and categories
   - Generate QR codes for tables

3. **Super Admin Platform**:
   - Manage multiple restaurants
   - Control subscriptions and access
   - Platform-wide analytics
   - Restaurant onboarding and configuration

## Key Features Implemented

### Customer Experience
- **Streamlined Welcome Flow**: Simple name entry with personalized greeting animation
- **QR Code Ordering**: Scan table QR codes to access menu instantly
- **Mobile-First Design**: Optimized for smartphones and tablets
- **Real-Time Order Tracking**: Live status updates with estimated preparation times
- **Persistent Order Tracking**: Order status survives page reloads

### Restaurant Management
- **Admin Dashboard**: Comprehensive order management and analytics
- **Real-Time Notifications**: Instant alerts for new orders with sound
- **Menu Management**: Add, edit, and organize menu items with photo upload
- **Order Status Control**: Update preparation status in real-time
- **QR Code Generation**: Create downloadable table-specific QR codes

### Multi-Restaurant Platform
- **Super Admin Panel**: Manage multiple restaurants from one interface
- **Subscription Management**: Control restaurant access and billing
- **Trial System**: 30-day free trials with automatic expiration
- **Platform Analytics**: Cross-restaurant performance metrics
- **Access Control**: Disable restaurants for expired subscriptions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connection (PostgreSQL)
- **drizzle-orm**: Database ORM with migrations
- **ws**: WebSocket server implementation
- **@tanstack/react-query**: Data fetching and caching
- **@radix-ui/***: Headless UI components for accessibility

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling
- **Vite**: Frontend build tool and development server

### Styling and UI
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

## Deployment Strategy

### Development Environment
- **Node.js 20**: Runtime environment
- **PostgreSQL 16**: Database system
- **Docker support**: Container-based deployment

### Build Process
- **Development**: `npm run dev` - Hot reload with tsx
- **Production Build**: `npm run build` - Vite frontend + esbuild backend
- **Database**: `npm run db:push` - Drizzle schema deployment

### Configuration Management
- **Restaurant config**: JSON-based configuration in `client/src/config/restaurant.json`
- **Environment variables**: DATABASE_URL, SESSION_SECRET
- **Feature flags**: Subscription and trial management

## Recent Development History

### Customer Experience Improvements
- Implemented streamlined guest welcome flow with name entry
- Added sweet welcome animation that greets customers by name
- Removed login complexity for customers - simple name capture creates personalized experience
- Fixed order tracking persistence - orders survive page reloads for both guests and logged-in users

### Platform Management Features
- Created comprehensive Super Admin panel at /super-admin route
- Added platform-wide analytics, restaurant management, and subscription controls
- Implemented subscription testing tools to expire trials and test access restrictions
- Created dedicated testing interface at /test-subscription for validating subscription controls

### Technical Enhancements
- Added WebSocket integration for real-time order status updates
- Implemented performance optimizations for handling 100+ simultaneous orders
- Created QR code generation system with downloadable table-specific codes
- Added comprehensive product management system with photo upload capabilities

### Authentication & Security
- Replaced SMS OTP with username/password authentication system
- Added email signup with validation and secure password hashing
- Implemented unified login form for both customers and admins with role-based redirection
- Added session-based authentication with proper security measures

## Production Deployment Status

### Deployment Readiness
Ready for production deployment with:
- Full security and performance optimizations
- Multi-restaurant support with subscription management
- Real-time WebSocket updates with automatic reconnection
- Image compression and upload handling
- Comprehensive admin dashboard with analytics

### Security Features
- Request size limits and validation
- CORS configuration for production domains
- SQL injection protection via Drizzle ORM
- Environment-based configuration management
- Session security with secure cookies

### Performance Features
- Optimized for 100+ simultaneous orders
- Database connection pooling
- Image compression for menu photos
- Bundle optimization with Vite
- WebSocket connection management

## User Preferences

### Communication Style
- Simple, everyday language preferred
- Avoid technical jargon when explaining features
- Focus on practical functionality over implementation details

### Development Approach
- Full-stack type safety with TypeScript
- Component-based architecture with reusable UI elements
- Real-time features for enhanced user experience
- Mobile-first responsive design
- Progressive enhancement for features

## Testing and Quality Assurance

### Testing Framework
- **Vitest**: Unit and integration testing
- **Testing Library**: React component testing
- **TypeScript**: Compile-time error checking

### Quality Measures
- Type safety across frontend and backend
- Database schema validation
- API endpoint testing
- Real-time feature testing

## Future Considerations

### Scalability
- Horizontal scaling support
- Database optimization for high traffic
- CDN integration for static assets
- Load balancing configuration

### Feature Extensions
- Multi-language support
- Payment integration
- Inventory management
- Advanced analytics and reporting
- Mobile app development