import { 
  users, restaurants, menuCategories, menuItems, orders, otpVerifications,
  type User, type InsertUser,
  type Restaurant, type InsertRestaurant,
  type MenuCategory, type InsertMenuCategory,
  type MenuItem, type InsertMenuItem,
  type Order, type InsertOrder,
  type OtpVerification, type InsertOtp,
  ORDER_STATUSES
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<User | undefined>;

  // Restaurant operations
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  
  // Menu category operations
  getMenuCategories(restaurantId: number): Promise<MenuCategory[]>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;
  
  // Menu item operations
  getMenuItems(restaurantId: number, categoryId?: number): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  
  // Order operations
  getOrders(restaurantId: number, status?: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getTodayOrders(restaurantId: number): Promise<Order[]>;
  
  // Analytics
  getTodayStats(restaurantId: number): Promise<{
    orderCount: number;
    revenue: number;
    avgPrepTime: number;
    popularItems: Array<{ name: string; count: number }>;
  }>;
  
  // Super Admin operations
  getAllRestaurants(): Promise<Restaurant[]>;
  getAllOrders(): Promise<Order[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private restaurants: Map<number, Restaurant>;
  private menuCategories: Map<number, MenuCategory>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private otps: Map<number, OtpVerification>;
  private currentIds: {
    user: number;
    restaurant: number;
    menuCategory: number;
    menuItem: number;
    order: number;
    otp: number;
  };

  constructor() {
    this.users = new Map();
    this.restaurants = new Map();
    this.menuCategories = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.otps = new Map();
    this.currentIds = {
      user: 1,
      restaurant: 1,
      menuCategory: 1,
      menuItem: 1,
      order: 1,
      otp: 1,
    };

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create default admin user (password: admin123)
    // Using a pre-computed hash for "admin123"
    const defaultAdmin: User = {
      id: 1,
      username: "admin",
      email: "admin@restaurant.com",
      password: "9eb3eedafa493fc3e37bd3ee93fdef8478a19c5f0a57aeed41f0c8431ed01f19a19249ce238ab0fa0c3f1dd5b444f1c22c403cd33c5cf03b8032325e9b87aa1f.3e7e692ab6cdf3504458afcb07576a37",
      name: "Restaurant Admin",
      role: "ADMIN",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(1, defaultAdmin);
    this.currentIds.user = 2;

    // Create default restaurant
    const restaurant: Restaurant = {
      id: 1,
      name: "Icy Spicy Tadka",
      slug: "icy-spicy-tadka",
      description: "Authentic Pure Vegetarian Indian Restaurant",
      address: "123 Spice Street, Flavor Town",
      phone: "+91 98765 43210",
      email: "contact@icyspicytadka.com",
      logo: null,
      primaryColor: "#FF6B35",
      secondaryColor: "#C62828",
      accentColor: "#FFB300",
      tableCount: 15,
      serviceCharge: "10.00",
      gst: "5.00",
      orderModes: ["dine-in", "takeaway"],
      isActive: true,
      trialStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      planType: "trial",
      monthlyRate: "4999.00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.restaurants.set(1, restaurant);
    this.currentIds.restaurant = 2;

    // Create menu categories
    const categories: MenuCategory[] = [
      { id: 1, restaurantId: 1, name: "Parathas", displayOrder: 1, isActive: true },
      { id: 2, restaurantId: 1, name: "Thali", displayOrder: 2, isActive: true },
      { id: 3, restaurantId: 1, name: "Dal & Curries", displayOrder: 3, isActive: true },
      { id: 4, restaurantId: 1, name: "Snacks", displayOrder: 4, isActive: true },
      { id: 5, restaurantId: 1, name: "Beverages", displayOrder: 5, isActive: true },
      { id: 6, restaurantId: 1, name: "Desserts", displayOrder: 6, isActive: true },
    ];
    
    categories.forEach(cat => this.menuCategories.set(cat.id, cat));
    this.currentIds.menuCategory = 7;

    // Create menu items
    const items: MenuItem[] = [
      {
        id: 1, restaurantId: 1, categoryId: 1, name: "Butter Paratha", 
        description: "Flaky, buttery layers of perfection", price: "45.00",
        imageUrl: "https://images.unsplash.com/photo-1630431341973-02c9924c6e59?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: false, isAvailable: true, preparationTime: 10, displayOrder: 1
      },
      {
        id: 2, restaurantId: 1, categoryId: 3, name: "Dal Makhani",
        description: "Rich, creamy black lentils slow-cooked to perfection", price: "180.00",
        imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82605b905?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: true, isAvailable: true, preparationTime: 20, displayOrder: 1
      },
      {
        id: 3, restaurantId: 1, categoryId: 4, name: "Paneer Tikka",
        description: "Marinated cottage cheese grilled to perfection", price: "220.00",
        imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: true, isAvailable: true, preparationTime: 15, displayOrder: 1
      },
      {
        id: 4, restaurantId: 1, categoryId: 3, name: "Rajma Chawal",
        description: "Comfort food at its finest - kidney beans with rice", price: "160.00",
        imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: false, isAvailable: true, preparationTime: 15, displayOrder: 2
      },
      {
        id: 5, restaurantId: 1, categoryId: 5, name: "Mango Lassi",
        description: "Refreshing blend of yogurt and sweet mangoes", price: "85.00",
        imageUrl: "https://images.unsplash.com/photo-1600626335629-2d4ec653cdf3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: false, isAvailable: true, preparationTime: 5, displayOrder: 1
      },
      {
        id: 6, restaurantId: 1, categoryId: 4, name: "Chole Bhature",
        description: "Fluffy bread with spicy chickpea curry", price: "140.00",
        imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: true, isAvailable: true, preparationTime: 18, displayOrder: 2
      },
      {
        id: 7, restaurantId: 1, categoryId: 4, name: "Masala Dosa",
        description: "Crispy rice crepe with spiced potato filling", price: "120.00",
        imageUrl: "https://images.unsplash.com/photo-1694172848448-7ad1e4b22234?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: false, isAvailable: true, preparationTime: 12, displayOrder: 3
      },
      {
        id: 8, restaurantId: 1, categoryId: 6, name: "Gulab Jamun",
        description: "Soft milk dumplings in cardamom syrup", price: "60.00",
        imageUrl: "https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: false, isAvailable: true, preparationTime: 5, displayOrder: 1
      },
      {
        id: 9, restaurantId: 1, categoryId: 1, name: "Aloo Paratha",
        description: "Stuffed potato paratha with fresh herbs", price: "50.00",
        imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: true, isAvailable: true, preparationTime: 12, displayOrder: 2
      },
      {
        id: 10, restaurantId: 1, categoryId: 2, name: "Punjabi Thali",
        description: "Complete meal with dal, sabzi, roti, rice, pickle", price: "280.00",
        imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: true, isAvailable: true, preparationTime: 25, displayOrder: 1
      },
      {
        id: 11, restaurantId: 1, categoryId: 3, name: "Palak Paneer",
        description: "Creamy spinach curry with cottage cheese", price: "200.00",
        imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: true, isAvailable: true, preparationTime: 18, displayOrder: 3
      },
      {
        id: 12, restaurantId: 1, categoryId: 5, name: "Masala Chai",
        description: "Traditional spiced tea with milk", price: "25.00",
        imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: false, isAvailable: true, preparationTime: 3, displayOrder: 2
      },
      {
        id: 13, restaurantId: 1, categoryId: 4, name: "Samosa",
        description: "Crispy triangular pastry with spiced potato filling", price: "30.00",
        imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
        isVeg: true, isPopular: true, isAvailable: true, preparationTime: 8, displayOrder: 4
      },
    ];
    
    items.forEach(item => this.menuItems.set(item.id, item));
    this.currentIds.menuItem = 14;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const user: User = { 
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name || null,
      role: insertUser.role || "CUSTOMER",
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserLastLogin(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated: User = { ...user, lastLoginAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async createOtp(otp: InsertOtp): Promise<OtpVerification> {
    const id = this.currentIds.otp || 1;
    this.currentIds.otp = id + 1;
    
    const otpRecord: OtpVerification = {
      ...otp,
      id,
      isUsed: false,
      createdAt: new Date()
    };
    
    if (!this.otps) this.otps = new Map();
    this.otps.set(id, otpRecord);
    return otpRecord;
  }

  async getValidOtp(phoneNumber: string, otp: string): Promise<OtpVerification | undefined> {
    if (!this.otps) return undefined;
    
    return Array.from(this.otps.values()).find(record => 
      record.phoneNumber === phoneNumber && 
      record.otp === otp && 
      !record.isUsed && 
      new Date() < record.expiresAt
    );
  }

  async markOtpAsUsed(id: number): Promise<void> {
    if (!this.otps) return;
    
    const otp = this.otps.get(id);
    if (otp) {
      this.otps.set(id, { ...otp, isUsed: true });
    }
  }

  // Restaurant operations
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.currentIds.restaurant++;
    const newRestaurant: Restaurant = { 
      id, 
      name: restaurant.name,
      primaryColor: restaurant.primaryColor || "#FF6B35",
      secondaryColor: restaurant.secondaryColor || "#C62828",
      accentColor: restaurant.accentColor || "#FFB300",
      tableCount: restaurant.tableCount || 15,
      serviceCharge: restaurant.serviceCharge || "10.00",
      gst: restaurant.gst || "5.00",
      orderModes: restaurant.orderModes || ["dine-in", "takeaway"],
      isActive: restaurant.isActive !== undefined ? restaurant.isActive : true,
      subscriptionEndDate: restaurant.subscriptionEndDate || null,
      createdAt: new Date() 
    };
    this.restaurants.set(id, newRestaurant);
    return newRestaurant;
  }

  async updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const existing = this.restaurants.get(id);
    if (!existing) return undefined;
    
    const updated: Restaurant = { ...existing, ...restaurant };
    this.restaurants.set(id, updated);
    return updated;
  }

  // Menu category operations
  async getMenuCategories(restaurantId: number): Promise<MenuCategory[]> {
    return Array.from(this.menuCategories.values())
      .filter(cat => cat.restaurantId === restaurantId && cat.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const id = this.currentIds.menuCategory++;
    const newCategory: MenuCategory = { 
      id, 
      restaurantId: category.restaurantId,
      name: category.name,
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive !== undefined ? category.isActive : true
    };
    this.menuCategories.set(id, newCategory);
    return newCategory;
  }

  // Menu item operations
  async getMenuItems(restaurantId: number, categoryId?: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values())
      .filter(item => 
        item.restaurantId === restaurantId && 
        item.isAvailable &&
        (categoryId ? item.categoryId === categoryId : true)
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const id = this.currentIds.menuItem++;
    const newItem: MenuItem = { 
      id,
      restaurantId: item.restaurantId,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || null,
      price: item.price,
      imageUrl: item.imageUrl || null,
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      isPopular: item.isPopular !== undefined ? item.isPopular : false,
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      preparationTime: item.preparationTime || null,
      displayOrder: item.displayOrder || 0
    };
    this.menuItems.set(id, newItem);
    return newItem;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const existing = this.menuItems.get(id);
    if (!existing) return undefined;
    
    const updated: MenuItem = {
      ...existing,
      name: item.name ?? existing.name,
      description: item.description ?? existing.description,
      price: item.price ?? existing.price,
      imageUrl: item.imageUrl ?? existing.imageUrl,
      isVeg: item.isVeg ?? existing.isVeg,
      isPopular: item.isPopular ?? existing.isPopular,
      isAvailable: item.isAvailable ?? existing.isAvailable,
      preparationTime: item.preparationTime ?? existing.preparationTime,
      displayOrder: item.displayOrder ?? existing.displayOrder,
    };
    this.menuItems.set(id, updated);
    return updated;
  }

  // Order operations
  async getOrders(restaurantId: number, status?: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => 
        order.restaurantId === restaurantId &&
        (status ? order.status === status : true)
      )
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(order => order.orderNumber === orderNumber);
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.currentIds.order++;
    const orderNumber = `ORD-${Date.now()}-${id}`;
    const now = new Date();
    
    const order: Order = {
      id,
      restaurantId: orderData.restaurantId,
      orderNumber,
      tableNumber: orderData.tableNumber || null,
      orderType: orderData.orderType,
      status: orderData.status || "pending",
      items: orderData.items as Array<{
        id: number;
        name: string;
        price: string;
        quantity: number;
        total: string;
      }>,
      subtotal: orderData.subtotal,
      serviceCharge: orderData.serviceCharge || "0.00",
      gst: orderData.gst || "0.00",
      total: orderData.total,
      customerName: orderData.customerName || null,
      customerPhone: orderData.customerPhone || null,
      notes: orderData.notes || null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updated: Order = {
      ...order,
      status,
      updatedAt: new Date(),
    };
    
    this.orders.set(id, updated);
    return updated;
  }

  async getTodayOrders(restaurantId: number): Promise<Order[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.orders.values())
      .filter(order => 
        order.restaurantId === restaurantId &&
        order.createdAt && new Date(order.createdAt) >= today
      );
  }

  async getTodayStats(restaurantId: number): Promise<{
    orderCount: number;
    revenue: number;
    avgPrepTime: number;
    popularItems: Array<{ name: string; count: number }>;
  }> {
    const todayOrders = await this.getTodayOrders(restaurantId);
    
    const orderCount = todayOrders.length;
    const revenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    
    // Calculate average prep time (simplified)
    const avgPrepTime = 12; // minutes - simplified for demo
    
    // Calculate popular items
    const itemCounts = new Map<string, number>();
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        const currentCount = itemCounts.get(item.name) || 0;
        itemCounts.set(item.name, currentCount + item.quantity);
      });
    });
    
    const popularItems = Array.from(itemCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    return { orderCount, revenue, avgPrepTime, popularItems };
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant || undefined;
  }

  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await db
      .insert(restaurants)
      .values(restaurant)
      .returning();
    return newRestaurant;
  }

  async updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [updated] = await db
      .update(restaurants)
      .set(restaurant)
      .where(eq(restaurants.id, id))
      .returning();
    return updated || undefined;
  }

  async getMenuCategories(restaurantId: number): Promise<MenuCategory[]> {
    return await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.restaurantId, restaurantId))
      .orderBy(menuCategories.displayOrder);
  }

  async createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory> {
    const [newCategory] = await db
      .insert(menuCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async getMenuItems(restaurantId: number, categoryId?: number): Promise<MenuItem[]> {
    if (categoryId) {
      return await db
        .select()
        .from(menuItems)
        .where(and(
          eq(menuItems.restaurantId, restaurantId),
          eq(menuItems.categoryId, categoryId)
        ))
        .orderBy(menuItems.displayOrder);
    }
    
    return await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.restaurantId, restaurantId))
      .orderBy(menuItems.displayOrder);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item || undefined;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [newItem] = await db
      .insert(menuItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await db
      .update(menuItems)
      .set(item)
      .where(eq(menuItems.id, id))
      .returning();
    return updated || undefined;
  }

  async getOrders(restaurantId: number, status?: string): Promise<Order[]> {
    if (status) {
      return await db
        .select()
        .from(orders)
        .where(and(
          eq(orders.restaurantId, restaurantId),
          eq(orders.status, status)
        ))
        .orderBy(orders.createdAt);
    }
    
    return await db
      .select()
      .from(orders)
      .where(eq(orders.restaurantId, restaurantId))
      .orderBy(orders.createdAt);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  async getTodayOrders(restaurantId: number): Promise<Order[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db
      .select()
      .from(orders)
      .where(eq(orders.restaurantId, restaurantId))
      .orderBy(orders.createdAt);
  }

  async getTodayStats(restaurantId: number): Promise<{
    orderCount: number;
    revenue: number;
    avgPrepTime: number;
    popularItems: Array<{ name: string; count: number }>;
  }> {
    const todayOrders = await this.getTodayOrders(restaurantId);
    
    const orderCount = todayOrders.length;
    const revenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    
    // Calculate average prep time (simplified)
    const avgPrepTime = 12; // minutes - simplified for demo
    
    // Calculate popular items
    const itemCounts = new Map<string, number>();
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        const currentCount = itemCounts.get(item.name) || 0;
        itemCounts.set(item.name, currentCount + item.quantity);
      });
    });
    
    const popularItems = Array.from(itemCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    return { orderCount, revenue, avgPrepTime, popularItems };
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants);
  }

  async getAllOrders(): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(orders.createdAt);
  }
}

export const storage = new MemStorage();
