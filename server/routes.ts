import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerAdminRoutes } from "./admin_routes";
import OpenAI from "openai";

// Initialize OpenAI client lazily (only when needed)
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

// Initialize Perplexity client lazily (only if API key is available)
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
      
      // Check if settings exist, if so update, else create
      const existing = await storage.getUserSettings(userId);
      let settings;
      
      if (existing) {
        settings = await storage.updateUserSettings(userId, input);
      } else {
        // Ensure userId matches auth
        if (input.userId !== userId) {
             // Force userId to match authenticated user
             input.userId = userId;
        }
        settings = await storage.createUserSettings(input);
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

      // Check subscription status if needed
      // if (settings.subscriptionStatus !== 'premium') ...

      // Generate workout with OpenAI
      const prompt = `
        Create a workout for:
        Goal: ${settings.goal}
        Time Available: ${settings.timeAvailable} minutes
        Muscle Group: ${muscleGroup}
        Location: ${settings.currentLocation} (Adjust exercises based on equipment likely available here)
        
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

      // Save workout
      const workout = await storage.createWorkout({
        userId,
        muscleGroup,
        plan: exercises,
        // completed: false, // Default
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

  // Q&A Routes - Perplexity
  app.post(api.qa.ask.path, isAuthenticated, async (req: any, res) => {
    try {
      const { question } = api.qa.ask.input.parse(req.body);
      
      // Get user settings for context
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      
      const systemPrompt = `Você é um especialista em fitness e nutrição com vasta experiência em treinos de ganho de massa, perda de peso e definição muscular. Responda em português do Brasil de forma clara, prática e baseada em evidências científicas. Forneça recomendações específicas para pessoas que treinam em academias.`;
      
      const userContext = settings ? `\nContexto do usuário: Objetivo: ${settings.goal}, Tempo disponível: ${settings.timeAvailable}min, Frequência: ${settings.frequency}x por semana, Academia: ${settings.currentLocation}` : '';
      
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

  return httpServer;
}
