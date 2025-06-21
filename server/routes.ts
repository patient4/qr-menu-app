import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertOrderSchema, ORDER_STATUSES } from "@shared/schema";
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

  return httpServer;
}
