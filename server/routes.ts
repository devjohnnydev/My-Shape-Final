import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerAdminRoutes } from "./admin_routes";
import OpenAI from "openai";
import { users } from "@shared/models/auth";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Initialize OpenAI client lazily
let openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return openai;
}

// Perplexity client
let perplexity: OpenAI | null = null;
function getPerplexityClient(): OpenAI {
  if (!perplexity) {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }
    perplexity = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: "https://api.perplexity.ai",
    });
  }
  return perplexity;
}

// Admin authentication middleware
async function isAdmin(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await storage.getUserById(req.user.claims.sub);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Authentication
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Register admin routes
  await registerAdminRoutes(app);

  // User Settings Routes
  app.get(api.user.getSettings.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const settings = await storage.getUserSettings(userId);
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    res.json(settings);
  });

  app.post(api.user.updateSettings.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.user.updateSettings.input.parse(req.body);
      
      const existing = await storage.getUserSettings(userId);
      let settings;
      
      if (existing) {
        settings = await storage.updateUserSettings(userId, input);
      } else {
        settings = await storage.createUserSettings({ ...input, userId });
      }
      
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Workout Routes
  app.get(api.workouts.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const workouts = await storage.getWorkouts(userId);
    res.json(workouts);
  });

  app.post(api.workouts.generate.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { muscleGroup } = api.workouts.generate.input.parse(req.body);
      
      const settings = await storage.getUserSettings(userId);
      if (!settings) {
        return res.status(400).json({ message: "Please complete your profile first" });
      }

      const prompt = `
        Create a workout for:
        Goal: ${settings.goal}
        Time Available: ${settings.timeAvailable} minutes
        Muscle Group: ${muscleGroup}
        Location: ${settings.currentLocation}
        
        Return a JSON object with a 'exercises' array. Each exercise should have:
        - name
        - sets
        - reps
        - rest (in seconds)
        - notes (brief tip)
      `;

      const completion = await getOpenAIClient().chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are an expert fitness trainer. Output valid JSON only." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      const exercises = result.exercises || [];

      const workout = await storage.createWorkout({
        userId,
        muscleGroup,
        plan: exercises,
      });

      res.json(workout);
    } catch (err) {
      console.error("Workout generation error:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Failed to generate workout" });
      }
    }
  });

  app.post(api.workouts.complete.path, isAuthenticated, async (req: any, res) => {
    const id = Number(req.params.id);
    const userId = req.user.claims.sub;
    
    const workout = await storage.getWorkout(id);
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    
    if (workout.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await storage.completeWorkout(id);
    res.json(updated);
  });

  // Q&A Routes
  app.post(api.qa.ask.path, isAuthenticated, async (req: any, res) => {
    try {
      const { question } = api.qa.ask.input.parse(req.body);
      const userId = req.user.claims.sub;
      const user = await storage.getUserById(userId);
      
      // Check if user has AI chat access
      if (user?.accessLevel !== 'total' || !user?.aiChatEnabled) {
        return res.status(403).json({ message: "AI chat access not available for your plan" });
      }
      
      const settings = await storage.getUserSettings(userId);
      
      const systemPrompt = `Você é um especialista em fitness e nutrição com vasta experiência em treinos de ganho de massa, perda de peso e definição muscular. Responda em português do Brasil de forma clara, prática e baseada em evidências científicas.`;
      
      const userContext = settings ? `\nContexto do usuário: Objetivo: ${settings.goal}, Tempo disponível: ${settings.timeAvailable}min, Frequência: ${settings.frequency}x por semana` : '';
      
      const completion = await getPerplexityClient().chat.completions.create({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${question}${userContext}` }
        ],
        temperature: 0.7,
        top_p: 0.9,
      });

      const answer = completion.choices[0].message.content || "Não foi possível gerar uma resposta.";
      
      res.json({
        answer,
        sources: [],
      });
    } catch (err) {
      console.error("Q&A error:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Falha ao processar pergunta" });
      }
    }
  });

  // Admin Routes - Gyms
  app.get(api.admin.gyms.list.path, isAdmin, async (req: any, res) => {
    try {
      const gyms = await storage.getGyms();
      res.json(gyms);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch gyms" });
    }
  });

  app.post(api.admin.gyms.create.path, isAdmin, async (req: any, res) => {
    try {
      const input = api.admin.gyms.create.input.parse(req.body);
      const gym = await storage.createGym(input);
      res.json(gym);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Failed to create gym" });
      }
    }
  });

  app.patch(`${api.admin.gyms.update.path}`, isAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.admin.gyms.update.input.parse(req.body);
      const gym = await storage.updateGym(id, input);
      res.json(gym);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Failed to update gym" });
      }
    }
  });

  app.delete(`${api.admin.gyms.delete.path}`, isAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteGym(id);
      res.json({ message: "Gym deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete gym" });
    }
  });

  // Admin Routes - Users
  app.get(api.admin.users.list.path, isAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post(`${api.admin.users.approve.path}`, isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { accessLevel, aiChatEnabled } = api.admin.users.approve.input.parse(req.body);
      
      const updated = await storage.updateUser(userId, {
        approvalStatus: 'approved',
        accessLevel,
        aiChatEnabled: aiChatEnabled ?? false,
      });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Failed to approve user" });
      }
    }
  });

  app.post(`${api.admin.users.reject.path}`, isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const updated = await storage.updateUser(userId, {
        approvalStatus: 'rejected',
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  app.post(`${api.admin.users.block.path}`, isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const updated = await storage.updateUser(userId, {
        approvalStatus: 'blocked',
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.patch(`${api.admin.users.updateAccess.path}`, isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const updates = api.admin.users.updateAccess.input.parse(req.body);
      const updated = await storage.updateUser(userId, updates);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Failed to update user access" });
      }
    }
  });

  // Admin Dashboard Stats
  app.get(api.admin.dashboard.stats.path, isAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const gyms = await storage.getGyms();
      const pendingUsers = await storage.getPendingUsers();
      const approvedUsers = await storage.getApprovedUsers();

      const totalUsers = allUsers.length;
      const totalGyms = gyms.length;
      const totalPending = pendingUsers.length;
      const totalApproved = approvedUsers.length;
      const totalAccessTotal = allUsers.filter(u => u.accessLevel === 'total').length;
      const totalAccessPartial = allUsers.filter(u => u.accessLevel === 'partial').length;

      res.json({
        totalUsers,
        totalGyms,
        totalPending,
        totalApproved,
        totalAccessTotal,
        totalAccessPartial,
        usersByGym: allUsers.reduce((acc: any, user) => {
          if (user.gymId) {
            acc[user.gymId] = (acc[user.gymId] || 0) + 1;
          }
          return acc;
        }, {}),
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  return httpServer;
}
