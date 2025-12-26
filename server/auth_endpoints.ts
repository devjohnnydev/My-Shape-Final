import type { Express } from "express";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function registerAuthEndpoints(app: Express): Promise<void> {
  // User registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, age, plan, gymId } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      // Check if user exists
      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create new user with pending approval status
      const [newUser] = await db.insert(users).values({
        email,
        firstName,
        lastName,
        age: age ? parseInt(age) : undefined,
        plan,
        gymId: gymId ? parseInt(gymId) : undefined,
        approvalStatus: "pending",
        accessLevel: "partial",
        isAdmin: false,
      }).returning();

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Admin login endpoint (simple for now)
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find admin user
      const [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!adminUser || !adminUser.isAdmin) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      // Return simple token (in production, use JWT)
      res.json({ token: "admin-" + adminUser.id, userId: adminUser.id });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get all gyms for registration
  app.get("/api/gyms", async (req, res) => {
    try {
      const { gyms } = await import("@shared/schema");
      const allGyms = await db.select().from(gyms);
      res.json(allGyms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gyms" });
    }
  });
}
