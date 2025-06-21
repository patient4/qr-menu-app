import { Express } from "express";
import { storage } from "./storage";

// Simple OTP storage for development
const otpStore = new Map<string, { otp: string; expiresAt: Date; userType: string }>();

export function setupAuthRoutes(app: Express) {
  // Send OTP
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phoneNumber, userType } = req.body;
      
      if (!phoneNumber || !userType) {
        return res.status(400).json({ message: "Phone number and user type are required" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP temporarily
      otpStore.set(phoneNumber, { otp, expiresAt, userType });

      // Log OTP for development
      console.log(`🔐 OTP for ${phoneNumber}: ${otp}`);
      
      res.json({ 
        message: "OTP sent successfully",
        ...(process.env.NODE_ENV === "development" && { otp })
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP and login
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phoneNumber, otp, name, userType } = req.body;
      
      if (!phoneNumber || !otp || !userType) {
        return res.status(400).json({ message: "Phone number, OTP, and user type are required" });
      }

      // Check stored OTP
      const storedOtp = otpStore.get(phoneNumber);
      if (!storedOtp || storedOtp.otp !== otp || new Date() > storedOtp.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Remove used OTP
      otpStore.delete(phoneNumber);

      // Check if user exists
      let user = await storage.getUserByPhoneNumber(phoneNumber);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          phoneNumber,
          role: userType,
          name: name || null,
        });
      } else {
        // Update last login
        await storage.updateUserLastLogin(user.id);
      }

      res.json({
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        name: user.name,
        message: "Login successful"
      });
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Admin creation
  app.post("/api/admin/create", async (req, res) => {
    try {
      const { phoneNumber, name } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByPhoneNumber(phoneNumber);
      if (existingUser) {
        return res.status(400).json({ message: "User with this phone number already exists" });
      }

      // Generate OTP for admin creation
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      otpStore.set(phoneNumber, { otp, expiresAt, userType: "ADMIN" });

      console.log(`🔐 Admin OTP for ${phoneNumber}: ${otp}`);
      
      res.json({ 
        message: "Admin OTP sent successfully",
        ...(process.env.NODE_ENV === "development" && { otp })
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    res.json({ message: "Logout successful" });
  });
}