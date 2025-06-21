import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertOrderSchema, ORDER_STATUSES } from "@shared/schema";
import { setupAuthRoutes } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast function
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Restaurant configuration routes
  app.get("/api/restaurant/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const restaurant = await storage.getRestaurant(id);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.patch("/api/restaurant/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const restaurant = await storage.updateRestaurant(id, req.body);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to update restaurant" });
    }
  });

  // Menu routes
  app.get("/api/restaurant/:id/categories", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const categories = await storage.getMenuCategories(restaurantId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/restaurant/:id/menu", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      const items = await storage.getMenuItems(restaurantId, categoryId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu-item/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getMenuItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu item" });
    }
  });

  // Create menu item
  app.post("/api/menu-items", async (req, res) => {
    try {
      const item = await storage.createMenuItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  // Update menu item
  app.patch("/api/menu-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateMenuItem(id, req.body);
      
      if (!item) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });

  // Delete menu item
  app.delete("/api/menu-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Set isAvailable to false instead of actual deletion for order history
      const item = await storage.updateMenuItem(id, { isAvailable: false });
      
      if (!item) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json({ message: "Menu item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Get order by number
  app.get("/api/orders/by-number/:orderNumber", async (req, res) => {
    try {
      const orderNumber = req.params.orderNumber;
      const order = await storage.getOrderByNumber(orderNumber);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Upgrade restaurant subscription
  app.post("/api/restaurant/:id/upgrade", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { planType } = req.body;
      
      // Calculate subscription end date (1 month from now)
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      
      const restaurant = await storage.updateRestaurant(id, {
        planType: planType || "premium",
        subscriptionEndDate,
        isActive: true,
      });
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to upgrade subscription" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      
      // Broadcast new order to admin clients
      broadcast({
        type: 'NEW_ORDER',
        data: order
      });
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/restaurant/:id/orders", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const status = req.query.status as string;
      
      const orders = await storage.getOrders(restaurantId, status);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!Object.values(ORDER_STATUSES).includes(status)) {
        return res.status(400).json({ message: "Invalid order status" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Broadcast order status update
      broadcast({
        type: 'ORDER_STATUS_UPDATE',
        data: order
      });
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Analytics routes
  app.get("/api/restaurant/:id/stats", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const stats = await storage.getTodayStats(restaurantId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Super Admin Routes
  app.get("/api/super-admin/stats", async (req, res) => {
    try {
      // Get all restaurants for counting
      const allRestaurants = await storage.getAllRestaurants();
      const now = new Date();
      
      let totalRevenue = 0;
      let totalOrders = 0;
      let activeSubscriptions = 0;
      let trialRestaurants = 0;
      let expiredSubscriptions = 0;

      // Calculate stats from all restaurants
      for (const restaurant of allRestaurants) {
        const stats = await storage.getTodayStats(restaurant.id);
        totalRevenue += stats.revenue;
        totalOrders += stats.orderCount;

        // Check subscription status
        if (restaurant.subscriptionEndDate) {
          const endDate = new Date(restaurant.subscriptionEndDate);
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysLeft < 0) {
            expiredSubscriptions++;
          } else if (daysLeft <= 30) {
            trialRestaurants++;
          } else {
            activeSubscriptions++;
          }
        } else {
          expiredSubscriptions++;
        }
      }

      res.json({
        totalRestaurants: allRestaurants.length,
        activeSubscriptions,
        totalRevenue,
        totalOrders,
        trialRestaurants,
        expiredSubscriptions
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch super admin stats" });
    }
  });

  app.get("/api/super-admin/restaurants", async (req, res) => {
    try {
      const restaurants = await storage.getAllRestaurants();
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get("/api/super-admin/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all orders" });
    }
  });

  app.get("/api/super-admin/analytics", async (req, res) => {
    try {
      const restaurants = await storage.getAllRestaurants();
      const analytics = [];

      for (const restaurant of restaurants) {
        const stats = await storage.getTodayStats(restaurant.id);
        const orders = await storage.getTodayOrders(restaurant.id);
        
        analytics.push({
          restaurantId: restaurant.id,
          name: restaurant.name,
          ordersToday: stats.orderCount,
          revenueToday: stats.revenue,
          avgOrderValue: orders.length > 0 ? stats.revenue / orders.length : 0,
          subscriptionStatus: restaurant.isActive ? 'active' : 'inactive',
          lastActivity: restaurant.updatedAt || restaurant.createdAt
        });
      }

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.patch("/api/super-admin/restaurants/:id/subscription", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const { action } = req.body;
      
      let updateData: any = {};
      const now = new Date();

      switch (action) {
        case 'activate':
          updateData = { 
            isActive: true,
            subscriptionEndDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year
          };
          break;
        case 'suspend':
          updateData = { isActive: false };
          break;
        case 'expire_trial':
          updateData = { 
            isActive: false,
            planType: "expired",
            subscriptionEndDate: new Date(now.getTime() - 1000) // 1 second ago
          };
          break;
        case 'extend_trial':
          updateData = { 
            subscriptionEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
          };
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }

      const restaurant = await storage.updateRestaurant(restaurantId, updateData);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Broadcast subscription update
      broadcast({
        type: 'SUBSCRIPTION_UPDATE',
        data: {
          restaurantId,
          restaurantName: restaurant.name,
          action,
          newStatus: restaurant.isActive
        }
      });

      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  app.get("/api/restaurant/:id/orders/today", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const orders = await storage.getTodayOrders(restaurantId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's orders" });
    }
  });

  // QR Code generation
  app.get("/api/restaurant/:id/qr", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const tableNumber = req.query.table as string;
      
      // Generate QR data (URL to customer app)
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const qrData = `${baseUrl}/?restaurant=${restaurantId}${tableNumber ? `&table=${tableNumber}` : ''}`;
      
      res.json({ 
        qrData,
        tableNumber: tableNumber || null,
        restaurantId 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Create restaurant (super admin)
  app.post("/api/restaurants", async (req, res) => {
    try {
      const restaurant = await storage.createRestaurant(req.body);
      res.status(201).json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });

  // Setup authentication routes
  setupAuthRoutes(app);

  return httpServer;
}
