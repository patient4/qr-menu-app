import { pgTable, text, serial, integer, boolean, timestamp, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").unique().notNull(),
  role: text("role").notNull().default("CUSTOMER"), // CUSTOMER or ADMIN
  name: text("name"),
  lastLoginAt: timestamp("last_login_at"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // for custom domains like icy-spicy-tadka.replit.app
  description: text("description"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logo: text("logo"), // URL to logo image
  primaryColor: text("primary_color").notNull().default("#FF6B35"),
  secondaryColor: text("secondary_color").notNull().default("#C62828"),
  accentColor: text("accent_color").notNull().default("#FFB300"),
  tableCount: integer("table_count").notNull().default(15),
  serviceCharge: decimal("service_charge", { precision: 5, scale: 2 }).notNull().default("10.00"),
  gst: decimal("gst", { precision: 5, scale: 2 }).notNull().default("5.00"),
  orderModes: text("order_modes").array().notNull().default(["dine-in", "takeaway"]),
  isActive: boolean("is_active").notNull().default(true),
  trialStartDate: timestamp("trial_start_date").defaultNow(),
  subscriptionEndDate: timestamp("subscription_end_date"),
  planType: text("plan_type").notNull().default("trial"), // trial, basic, premium
  monthlyRate: decimal("monthly_rate", { precision: 10, scale: 2 }).default("4999.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isVeg: boolean("is_veg").notNull().default(true),
  isPopular: boolean("is_popular").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  preparationTime: integer("preparation_time").default(15), // in minutes
  displayOrder: integer("display_order").notNull().default(0),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  orderNumber: text("order_number").notNull().unique(),
  tableNumber: text("table_number"), // null for takeaway
  orderType: text("order_type").notNull(), // "dine-in" or "takeaway"
  status: text("status").notNull().default("pending"), // pending, preparing, ready, completed, cancelled
  items: json("items").$type<Array<{
    id: number;
    name: string;
    price: string;
    quantity: number;
    total: string;
  }>>().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  serviceCharge: decimal("service_charge", { precision: 10, scale: 2 }).notNull().default("0.00"),
  gst: decimal("gst", { precision: 10, scale: 2 }).notNull().default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).omit({
  id: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  phoneNumber: true,
  role: true,
  name: true,
});

export const insertOtpSchema = createInsertSchema(otpVerifications).pick({
  phoneNumber: true,
  otp: true,
  expiresAt: true,
});

export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;

// Types
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Order status enum
export const ORDER_STATUSES = {
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];
