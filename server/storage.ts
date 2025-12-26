import { db } from "./db";
import { userSettings, workouts, type InsertUserSettings, type InsertWorkout, type UserSettings, type Workout } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  
  getWorkouts(userId: string): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  completeWorkout(id: number): Promise<Workout>;
}

export class DatabaseStorage implements IStorage {
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const [newSettings] = await db.insert(userSettings).values(settings).returning();
    return newSettings;
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const [updated] = await db
      .update(userSettings)
      .set(settings)
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated;
  }

  async getWorkouts(userId: string): Promise<Workout[]> {
    return await db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, userId))
      .orderBy(desc(workouts.date));
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const [workout] = await db.select().from(workouts).where(eq(workouts.id, id));
    return workout;
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async completeWorkout(id: number): Promise<Workout> {
    const [updated] = await db
      .update(workouts)
      .set({ completed: true })
      .where(eq(workouts.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
