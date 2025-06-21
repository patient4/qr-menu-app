# 🍽️ Digital Restaurant Ordering System

A modern, full-stack QR-based restaurant ordering platform that enables seamless digital menu experiences for restaurants and customers. Built with React, TypeScript, and Node.js.

![Restaurant Ordering System](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80)

## ✨ Features

### 🎯 Customer Experience
- **QR Code Ordering** - Scan table QR codes to access menu instantly
- **Streamlined Welcome Flow** - Simple name entry with personalized experience
- **Mobile-First Design** - Optimized for smartphones and tablets
- **Real-Time Order Tracking** - Live status updates with estimated preparation times
- **Category-Based Menu** - Easy navigation through organized menu sections
- **Cart Management** - Add, remove, and modify orders with running totals

### 👨‍💼 Restaurant Management
- **Admin Dashboard** - Comprehensive order management and analytics
- **Real-Time Notifications** - Instant alerts for new orders with sound
- **Menu Management** - Add, edit, and organize menu items with photos
- **Order Status Control** - Update preparation status in real-time
- **Analytics & Reports** - Daily stats, popular items, and revenue tracking
- **QR Code Generation** - Create table-specific QR codes for ordering

### 🏢 Multi-Restaurant Platform
- **Super Admin Panel** - Manage multiple restaurants from one interface
- **Subscription Management** - Control restaurant access and billing
- **Platform Analytics** - Cross-restaurant performance metrics
- **Restaurant Creation** - Onboard new restaurants with full configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/restaurant-ordering-system.git
cd restaurant-ordering-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your database connection:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/restaurant_db
SESSION_SECRET=your-secret-key-here
```

4. **Set up the database**
```bash
npm run db:push
```

5. **Start the development server**
```bash
npm run dev
```

6. **Access the application**
- Customer ordering: `http://localhost:5000/customer`
- Admin dashboard: `http://localhost:5000/admin`
- Super admin: `http://localhost:5000/super-admin`

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS + shadcn/ui** for modern styling
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **WebSocket** integration for real-time updates

### Backend (Node.js + Express)
- **Express.js** RESTful API server
- **TypeScript** for full-stack type safety
- **Drizzle ORM** with PostgreSQL
- **WebSocket** for real-time communication
- **Session-based authentication**
- **File upload handling** for menu images

### Database (PostgreSQL)
- **Drizzle ORM** for type-safe database operations
- **Centralized schema** in `shared/schema.ts`
- **Migration system** with `drizzle-kit`

## 📱 Usage

### For Customers
1. Scan the QR code at your table
2. Enter your name to start ordering
3. Browse the menu by categories
4. Add items to your cart
5. Place your order and track status

### For Restaurant Staff
1. Login to the admin dashboard
2. Monitor incoming orders in real-time
3. Update order status as you prepare food
4. Manage menu items and categories
5. View daily analytics and reports

### For Platform Administrators
1. Access the super admin panel
2. Manage multiple restaurants
3. Control subscriptions and access
4. Monitor platform-wide analytics
5. Create new restaurant accounts

## 🛠️ Development

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
├── server/                 # Backend Express application
│   ├── auth.ts            # Authentication logic
│   ├── routes.ts          # API route handlers
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                 # Shared TypeScript types
│   └── schema.ts          # Database schema and types
└── docs/                  # Documentation
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Database
npm run db:push         # Push schema changes to database
npm run db:studio       # Open database studio

# Testing
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
```

### Adding a New Feature

1. **Update the database schema** in `shared/schema.ts`
2. **Add API endpoints** in `server/routes.ts`
3. **Create UI components** in `client/src/components/`
4. **Add pages** in `client/src/pages/`
5. **Update routing** in `client/src/App.tsx`

## 🔧 Configuration

### Restaurant Settings
Configure your restaurant in `client/src/config/restaurant.json`:

```json
{
  "name": "Your Restaurant Name",
  "description": "Your restaurant description",
  "primaryColor": "#FF6B35",
  "secondaryColor": "#C62828",
  "serviceCharge": 10,
  "gst": 5
}
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Session
SESSION_SECRET=your-secret-session-key

# Server
PORT=5000
NODE_ENV=development
```

## 📊 Features Overview

| Feature | Customer | Admin | Super Admin |
|---------|----------|-------|-------------|
| QR Code Scanning | ✅ | ❌ | ❌ |
| Menu Browsing | ✅ | ✅ | ✅ |
| Order Placement | ✅ | ❌ | ❌ |
| Order Management | ❌ | ✅ | ✅ |
| Menu Management | ❌ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ |
| Restaurant Management | ❌ | ❌ | ✅ |
| Subscription Control | ❌ | ❌ | ✅ |

## 🔐 Security Features

- **Session-based Authentication** with secure cookie handling
- **SQL Injection Protection** via Drizzle ORM
- **Request Size Limits** to prevent abuse
- **CORS Configuration** for production environments
- **Environment-based Configuration** management

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
# Build the image
docker build -t restaurant-ordering .

# Run the container
docker run -p 5000:5000 -e DATABASE_URL=your_db_url restaurant-ordering
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Build and deploy the application

## 🧪 Testing

### Running Tests
```bash
npm run test              # Run all tests
npm run test:unit         # Run unit tests
npm run test:integration  # Run integration tests
npm run test:e2e          # Run end-to-end tests
```

### Test Coverage
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for user workflows

## 📈 Performance

### Optimizations Included
- **Image compression** for menu photos
- **Lazy loading** for components
- **WebSocket connection** for real-time updates
- **Query caching** with TanStack Query
- **Database indexing** for optimal performance
- **Bundle optimization** with Vite

### Scaling Considerations
- Supports 100+ concurrent orders
- Horizontal scaling ready
- CDN integration for static assets
- Database connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by restaurant industry needs
- Community-driven development approach

## 📞 Support

For support, please:
1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/yourusername/restaurant-ordering-system/issues)
3. Create a new issue if needed

---

**Made with ❤️ for the restaurant industry**