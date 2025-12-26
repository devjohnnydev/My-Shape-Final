import type { Express, Request, Response } from "express";
import { db } from "./db";
import { 
  gyms, 
  userApprovals, 
  exercises, 
  exerciseInstructions,
  insertGymsSchema,
  insertUserApprovalsSchema,
  insertExercisesSchema,
  insertExerciseInstructionsSchema
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// Middleware to check if user is admin (basic check - should be enhanced)
const isAdmin = (req: any, res: Response, next: Function) => {
  // Check if user is admin - for now we'll trust the auth system
  // In production, check against an admin table
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

export async function registerAdminRoutes(app: Express): Promise<void> {
  // ==================== GYM MANAGEMENT ====================
  
  // Get all gyms
  app.get("/api/admin/gyms", isAdmin, async (req: any, res) => {
    try {
      const allGyms = await db.select().from(gyms).orderBy(desc(gyms.createdAt));
      res.json(allGyms);
    } catch (error) {
      console.error("Error fetching gyms:", error);
      res.status(500).json({ error: "Failed to fetch gyms" });
    }
  });

  // Get gyms list for users
  app.get("/api/gyms", async (req, res) => {
    try {
      const allGyms = await db.select().from(gyms).orderBy(gyms.name);
      res.json(allGyms);
    } catch (error) {
      console.error("Error fetching gyms:", error);
      res.status(500).json({ error: "Failed to fetch gyms" });
    }
  });

  // Create gym (admin only)
  app.post("/api/admin/gyms", isAdmin, async (req: any, res) => {
    try {
      const data = insertGymsSchema.parse(req.body);
      const [newGym] = await db.insert(gyms).values(data).returning();
      res.status(201).json(newGym);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error creating gym:", error);
      res.status(500).json({ error: "Failed to create gym" });
    }
  });

  // Update gym (admin only)
  app.put("/api/admin/gyms/:id", isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertGymsSchema.partial().parse(req.body);
      const [updated] = await db.update(gyms).set(data).where(eq(gyms.id, id)).returning();
      if (!updated) {
        return res.status(404).json({ error: "Gym not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error updating gym:", error);
      res.status(500).json({ error: "Failed to update gym" });
    }
  });

  // Delete gym (admin only)
  app.delete("/api/admin/gyms/:id", isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(gyms).where(eq(gyms.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting gym:", error);
      res.status(500).json({ error: "Failed to delete gym" });
    }
  });

  // ==================== USER APPROVALS ====================

  // Get pending user approvals (admin only)
  app.get("/api/admin/approvals", isAdmin, async (req: any, res) => {
    try {
      const approvals = await db.select().from(userApprovals).orderBy(desc(userApprovals.requestedAt));
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      res.status(500).json({ error: "Failed to fetch approvals" });
    }
  });

  // Approve user (admin only)
  app.post("/api/admin/approvals/:userId/approve", isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const { gymId } = req.body;
      
      const adminId = req.user.claims.sub;
      
      const [updated] = await db
        .update(userApprovals)
        .set({
          status: "approved",
          gymId,
          approvedBy: adminId,
          approvedAt: new Date(),
        })
        .where(eq(userApprovals.userId, userId))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "User approval not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ error: "Failed to approve user" });
    }
  });

  // Reject user (admin only)
  app.post("/api/admin/approvals/:userId/reject", isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const { reason } = req.body;
      
      const [updated] = await db
        .update(userApprovals)
        .set({
          status: "rejected",
          rejectionReason: reason || null,
        })
        .where(eq(userApprovals.userId, userId))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "User approval not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ error: "Failed to reject user" });
    }
  });

  // Request user approval (user endpoint)
  app.post("/api/user/request-approval", async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = req.user.claims.sub;
      
      // Check if approval already exists
      const existing = await db
        .select()
        .from(userApprovals)
        .where(eq(userApprovals.userId, userId));
      
      if (existing.length > 0) {
        return res.json(existing[0]);
      }
      
      // Create new approval request
      const [approval] = await db
        .insert(userApprovals)
        .values({
          userId,
          status: "pending",
        })
        .returning();
      
      res.status(201).json(approval);
    } catch (error) {
      console.error("Error requesting approval:", error);
      res.status(500).json({ error: "Failed to request approval" });
    }
  });

  // Get current user's approval status
  app.get("/api/user/approval-status", async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = req.user.claims.sub;
      const [approval] = await db
        .select()
        .from(userApprovals)
        .where(eq(userApprovals.userId, userId));
      
      res.json(approval || { status: "not_requested" });
    } catch (error) {
      console.error("Error fetching approval status:", error);
      res.status(500).json({ error: "Failed to fetch approval status" });
    }
  });

  // ==================== EXERCISE DATABASE ====================

  // Get all exercises
  app.get("/api/exercises", async (req, res) => {
    try {
      const allExercises = await db.select().from(exercises).orderBy(exercises.name);
      res.json(allExercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // Get exercise with instructions
  app.get("/api/exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [exercise] = await db.select().from(exercises).where(eq(exercises.id, id));
      
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      
      const instructions = await db
        .select()
        .from(exerciseInstructions)
        .where(eq(exerciseInstructions.exerciseId, id));
      
      res.json({ ...exercise, instructions });
    } catch (error) {
      console.error("Error fetching exercise:", error);
      res.status(500).json({ error: "Failed to fetch exercise" });
    }
  });

  // Create exercise (admin only)
  app.post("/api/admin/exercises", isAdmin, async (req: any, res) => {
    try {
      const data = insertExercisesSchema.parse(req.body);
      const [newExercise] = await db.insert(exercises).values(data).returning();
      res.status(201).json(newExercise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error creating exercise:", error);
      res.status(500).json({ error: "Failed to create exercise" });
    }
  });

  // Update exercise (admin only)
  app.put("/api/admin/exercises/:id", isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertExercisesSchema.partial().parse(req.body);
      const [updated] = await db.update(exercises).set(data).where(eq(exercises.id, id)).returning();
      if (!updated) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error updating exercise:", error);
      res.status(500).json({ error: "Failed to update exercise" });
    }
  });

  // Create exercise instruction (admin only)
  app.post("/api/admin/exercises/:exerciseId/instructions", isAdmin, async (req: any, res) => {
    try {
      const exerciseId = parseInt(req.params.exerciseId);
      const data = insertExerciseInstructionsSchema.parse({
        ...req.body,
        exerciseId,
      });
      const [instruction] = await db.insert(exerciseInstructions).values(data).returning();
      res.status(201).json(instruction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error creating instruction:", error);
      res.status(500).json({ error: "Failed to create instruction" });
    }
  });

  // Update exercise instruction (admin only)
  app.put("/api/admin/instructions/:id", isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertExerciseInstructionsSchema.partial().parse(req.body);
      const [updated] = await db.update(exerciseInstructions).set(data).where(eq(exerciseInstructions.id, id)).returning();
      if (!updated) {
        return res.status(404).json({ error: "Instruction not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error updating instruction:", error);
      res.status(500).json({ error: "Failed to update instruction" });
    }
  });

  // Delete instruction (admin only)
  app.delete("/api/admin/instructions/:id", isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(exerciseInstructions).where(eq(exerciseInstructions.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting instruction:", error);
      res.status(500).json({ error: "Failed to delete instruction" });
    }
  });
}
