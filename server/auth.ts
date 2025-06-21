import { Express } from "express";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { loginSchema, signupSchema } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuthRoutes(app: Express) {
  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const { username, password } = result.data;

      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Check password
      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        message: "Login successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const { username, email, password, name } = result.data;

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        name: name || null,
        role: "CUSTOMER", // Default role
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        message: "Account created successfully"
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Create admin user
  app.post("/api/auth/create-admin", async (req, res) => {
    try {
      const result = signupSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const { username, email, password, name } = result.data;

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create admin user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        name: name || null,
        role: "ADMIN",
      });

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        message: "Admin account created successfully"
      });
    } catch (error) {
      console.error("Admin creation error:", error);
      res.status(500).json({ message: "Failed to create admin account" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    res.json({ message: "Logout successful" });
  });

  // Debug endpoint to check users
  app.get("/api/auth/debug", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("admin");
      res.json({ 
        userFound: !!user,
        userData: user ? { id: user.id, username: user.username, role: user.role } : null 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}