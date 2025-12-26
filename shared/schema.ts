export * from "./models/auth";
export * from "./models/chat";

import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey().references(() => users.id),
  goal: text("goal").notNull(), // 'muscle_gain', 'weight_loss', 'definition'
  timeAvailable: integer("time_available").notNull(), // minutes
  frequency: integer("frequency").notNull(), // days per week
  currentLocation: text("current_location").default("home").notNull(), // 'skyfit', 'smartfit', 'gavioes', 'home'
  subscriptionStatus: text("subscription_status").default("free").notNull(), // 'free', 'premium'
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  muscleGroup: text("muscle_group").notNull(),
  plan: jsonb("plan").notNull(), // The generated workout array
  completed: boolean("completed").default(false).notNull(),
  feedback: text("feedback"),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings);
export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true, date: true, completed: true });

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

export type GenerateWorkoutRequest = {
  muscleGroup: string;
};

// Types for the generated workout plan JSON
export type Exercise = {
  name: string;
  sets: number;
  reps: number;
  rest: number; // seconds
  notes?: string;
};

export type WorkoutPlan = Exercise[];

// Gym Management Tables
export const gyms = pgTable("gyms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // 'Smartfit', 'SKYFIT', 'Gaviões', etc
  logo: text("logo"), // URL to logo image
  primaryColor: varchar("primary_color", { length: 7 }).notNull(), // Hex color #RRGGBB
  secondaryColor: varchar("secondary_color", { length: 7 }).notNull(), // Hex color #RRGGBB
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Approval/Authorization System
export const userApprovals = pgTable("user_approvals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  gymId: integer("gym_id").references(() => gyms.id), // Which gym the user is approved for
  approvedBy: text("approved_by"), // Admin user ID
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
});

// Exercise Database with Form/Instructions
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'Supino Reto', 'Leg Press', etc
  description: text("description"),
  muscleGroups: jsonb("muscle_groups").notNull(), // ['chest', 'triceps']
  difficulty: text("difficulty").notNull().default("intermediate"), // 'beginner', 'intermediate', 'advanced'
  equipmentNeeded: jsonb("equipment_needed"), // ['barbell', 'bench']
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exercise Instructions/Variations with different set/rep combinations
export const exerciseInstructions = pgTable("exercise_instructions", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  restSeconds: integer("rest_seconds").notNull().default(60),
  notes: text("notes"), // e.g., 'Rest 2 minutes between sets'
  gifUrl: text("gif_url"), // URL to GIF showing proper form
  videoUrl: text("video_url"), // Alternative video URL
  commonMistakes: jsonb("common_mistakes"), // ['keep core tight', 'control the negative']
  progressionTip: text("progression_tip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schemas
export const insertGymsSchema = createInsertSchema(gyms).omit({ id: true, createdAt: true });
export const insertUserApprovalsSchema = createInsertSchema(userApprovals).omit({ id: true, requestedAt: true, approvedAt: true });
export const insertExercisesSchema = createInsertSchema(exercises).omit({ id: true, createdAt: true });
export const insertExerciseInstructionsSchema = createInsertSchema(exerciseInstructions).omit({ id: true, createdAt: true });

// Types
export type Gym = typeof gyms.$inferSelect;
export type InsertGym = z.infer<typeof insertGymsSchema>;
export type UserApproval = typeof userApprovals.$inferSelect;
export type InsertUserApproval = z.infer<typeof insertUserApprovalsSchema>;
export type ExerciseRecord = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExercisesSchema>;
export type ExerciseInstruction = typeof exerciseInstructions.$inferSelect;
export type InsertExerciseInstruction = z.infer<typeof insertExerciseInstructionsSchema>;
