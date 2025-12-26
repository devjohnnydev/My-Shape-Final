export * from "./models/auth";
export * from "./models/chat";

import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

// Gym/Academy Management
export const gyms = pgTable("gyms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  primaryColor: varchar("primary_color", { length: 7 }).notNull(),
  secondaryColor: varchar("secondary_color", { length: 7 }).notNull(),
  partnershipType: text("partnership_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey().references(() => users.id),
  goal: text("goal").notNull(),
  timeAvailable: integer("time_available").notNull(),
  frequency: integer("frequency").notNull(),
  currentLocation: text("current_location").default("home").notNull(),
  subscriptionStatus: text("subscription_status").default("free").notNull(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  date: timestamp("date").defaultNow().notNull(),
  muscleGroup: text("muscle_group").notNull(),
  plan: jsonb("plan").notNull(),
  completed: boolean("completed").default(false).notNull(),
  feedback: text("feedback"),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  muscleGroups: jsonb("muscle_groups").notNull(),
  difficulty: text("difficulty").notNull().default("intermediate"),
  equipmentNeeded: jsonb("equipment_needed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exerciseInstructions = pgTable("exercise_instructions", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  restSeconds: integer("rest_seconds").notNull().default(60),
  notes: text("notes"),
  gifUrl: text("gif_url"),
  videoUrl: text("video_url"),
  commonMistakes: jsonb("common_mistakes"),
  progressionTip: text("progression_tip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schemas
export const insertGymSchema = createInsertSchema(gyms).omit({ id: true, createdAt: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings);
export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true, date: true, completed: true });
export const insertExercisesSchema = createInsertSchema(exercises).omit({ id: true, createdAt: true });
export const insertExerciseInstructionsSchema = createInsertSchema(exerciseInstructions).omit({ id: true, createdAt: true });

// Types
export type Gym = typeof gyms.$inferSelect;
export type InsertGym = z.infer<typeof insertGymSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type ExerciseRecord = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExercisesSchema>;
export type ExerciseInstruction = typeof exerciseInstructions.$inferSelect;
export type InsertExerciseInstruction = z.infer<typeof insertExerciseInstructionsSchema>;

export type GenerateWorkoutRequest = {
  muscleGroup: string;
};

export type Exercise = {
  name: string;
  sets: number;
  reps: number;
  rest: number;
  notes?: string;
};

export type WorkoutPlan = Exercise[];
