import { db } from "./db";
import { restaurants, menuCategories, menuItems } from "@shared/schema";

async function seed() {
  console.log("Starting database seeding...");

  // Create default restaurant
  const [restaurant] = await db.insert(restaurants).values({
    name: "Icy Spicy Tadka",
    primaryColor: "#FF6B35",
    secondaryColor: "#C62828",
    accentColor: "#FFB300",
    tableCount: 15,
    serviceCharge: "10.00",
    gst: "5.00",
    orderModes: ["dine-in", "takeaway"],
    isActive: true,
    subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  }).returning();

  console.log("Created restaurant:", restaurant.name);

  // Create menu categories
  const categories = await db.insert(menuCategories).values([
    { restaurantId: restaurant.id, name: "Parathas", displayOrder: 1, isActive: true },
    { restaurantId: restaurant.id, name: "Thali", displayOrder: 2, isActive: true },
    { restaurantId: restaurant.id, name: "Dal & Curries", displayOrder: 3, isActive: true },
    { restaurantId: restaurant.id, name: "Snacks", displayOrder: 4, isActive: true },
    { restaurantId: restaurant.id, name: "Beverages", displayOrder: 5, isActive: true },
    { restaurantId: restaurant.id, name: "Desserts", displayOrder: 6, isActive: true },
  ]).returning();

  console.log("Created categories:", categories.length);

  // Find category IDs
  const parathasCat = categories.find(c => c.name === "Parathas");
  const thaliCat = categories.find(c => c.name === "Thali");
  const dalCat = categories.find(c => c.name === "Dal & Curries");
  const snacksCat = categories.find(c => c.name === "Snacks");
  const beveragesCat = categories.find(c => c.name === "Beverages");
  const dessertsCat = categories.find(c => c.name === "Desserts");

  // Create menu items
  const items = await db.insert(menuItems).values([
    {
      restaurantId: restaurant.id,
      categoryId: parathasCat!.id,
      name: "Butter Paratha",
      description: "Flaky, buttery layers of perfection",
      price: "45.00",
      imageUrl: "https://images.unsplash.com/photo-1630431341973-02c9924c6e59?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: false,
      isAvailable: true,
      preparationTime: 10,
      displayOrder: 1
    },
    {
      restaurantId: restaurant.id,
      categoryId: parathasCat!.id,
      name: "Aloo Paratha",
      description: "Stuffed potato paratha with fresh herbs",
      price: "50.00",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: true,
      isAvailable: true,
      preparationTime: 12,
      displayOrder: 2
    },
    {
      restaurantId: restaurant.id,
      categoryId: thaliCat!.id,
      name: "Punjabi Thali",
      description: "Complete meal with dal, sabzi, roti, rice, pickle",
      price: "280.00",
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: true,
      isAvailable: true,
      preparationTime: 25,
      displayOrder: 1
    },
    {
      restaurantId: restaurant.id,
      categoryId: dalCat!.id,
      name: "Dal Makhani",
      description: "Rich, creamy black lentils slow-cooked to perfection",
      price: "180.00",
      imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82605b905?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: true,
      isAvailable: true,
      preparationTime: 20,
      displayOrder: 1
    },
    {
      restaurantId: restaurant.id,
      categoryId: dalCat!.id,
      name: "Rajma Chawal",
      description: "Comfort food at its finest - kidney beans with rice",
      price: "160.00",
      imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: false,
      isAvailable: true,
      preparationTime: 15,
      displayOrder: 2
    },
    {
      restaurantId: restaurant.id,
      categoryId: dalCat!.id,
      name: "Palak Paneer",
      description: "Creamy spinach curry with cottage cheese",
      price: "200.00",
      imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: true,
      isAvailable: true,
      preparationTime: 18,
      displayOrder: 3
    },
    {
      restaurantId: restaurant.id,
      categoryId: snacksCat!.id,
      name: "Paneer Tikka",
      description: "Marinated cottage cheese grilled to perfection",
      price: "220.00",
      imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: true,
      isAvailable: true,
      preparationTime: 15,
      displayOrder: 1
    },
    {
      restaurantId: restaurant.id,
      categoryId: snacksCat!.id,
      name: "Chole Bhature",
      description: "Fluffy bread with spicy chickpea curry",
      price: "140.00",
      imageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: true,
      isAvailable: true,
      preparationTime: 18,
      displayOrder: 2
    },
    {
      restaurantId: restaurant.id,
      categoryId: snacksCat!.id,
      name: "Masala Dosa",
      description: "Crispy rice crepe with spiced potato filling",
      price: "120.00",
      imageUrl: "https://images.unsplash.com/photo-1694172848448-7ad1e4b22234?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: false,
      isAvailable: true,
      preparationTime: 12,
      displayOrder: 3
    },
    {
      restaurantId: restaurant.id,
      categoryId: snacksCat!.id,
      name: "Samosa",
      description: "Crispy triangular pastry with spiced potato filling",
      price: "30.00",
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: true,
      isAvailable: true,
      preparationTime: 8,
      displayOrder: 4
    },
    {
      restaurantId: restaurant.id,
      categoryId: beveragesCat!.id,
      name: "Mango Lassi",
      description: "Refreshing blend of yogurt and sweet mangoes",
      price: "85.00",
      imageUrl: "https://images.unsplash.com/photo-1600626335629-2d4ec653cdf3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: false,
      isAvailable: true,
      preparationTime: 5,
      displayOrder: 1
    },
    {
      restaurantId: restaurant.id,
      categoryId: beveragesCat!.id,
      name: "Masala Chai",
      description: "Traditional spiced tea with milk",
      price: "25.00",
      imageUrl: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: false,
      isAvailable: true,
      preparationTime: 3,
      displayOrder: 2
    },
    {
      restaurantId: restaurant.id,
      categoryId: dessertsCat!.id,
      name: "Gulab Jamun",
      description: "Soft milk dumplings in cardamom syrup",
      price: "60.00",
      imageUrl: "https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80",
      isVeg: true,
      isPopular: false,
      isAvailable: true,
      preparationTime: 5,
      displayOrder: 1
    }
  ]).returning();

  console.log("Created menu items:", items.length);
  console.log("Database seeding completed successfully!");
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch(console.error);
}

export { seed };