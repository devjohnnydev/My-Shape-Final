import { db } from "./db";
import { 
  userSettings, 
  workouts, 
  gyms,
  type InsertUserSettings, 
  type InsertWorkout, 
  type UserSettings, 
  type Workout,
  type Gym,
  type InsertGym
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { users, type User } from "@shared/models/auth";

export interface IStorage {
  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  
  // Workouts
  getWorkouts(userId: string): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  completeWorkout(id: number): Promise<Workout>;
  
  // Gyms (Admin)
  getGyms(): Promise<Gym[]>;
  getGym(id: number): Promise<Gym | undefined>;
  createGym(gym: InsertGym): Promise<Gym>;
  updateGym(id: number, gym: Partial<InsertGym>): Promise<Gym>;
  deleteGym(id: number): Promise<void>;
  
  // Users (Admin)
  getAllUsers(): Promise<User[]>;
  getUserById(userId: string): Promise<User | undefined>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  getPendingUsers(): Promise<User[]>;
  getApprovedUsers(): Promise<User[]>;
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

  // Gym operations
  async getGyms(): Promise<Gym[]> {
    return await db.select().from(gyms);
  }

  async getGym(id: number): Promise<Gym | undefined> {
    const [gym] = await db.select().from(gyms).where(eq(gyms.id, id));
    return gym;
  }

  async createGym(gym: InsertGym): Promise<Gym> {
    const [newGym] = await db.insert(gyms).values(gym).returning();
    return newGym;
  }

  async updateGym(id: number, gym: Partial<InsertGym>): Promise<Gym> {
    const [updated] = await db
      .update(gyms)
      .set(gym)
      .where(eq(gyms.id, id))
      .returning();
    return updated;
  }

  async deleteGym(id: number): Promise<void> {
    await db.delete(gyms).where(eq(gyms.id, id));
  }

  // User operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isAdmin, false));
  }

  async getUserById(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getPendingUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.approvalStatus, "pending"), eq(users.isAdmin, false)));
  }

  async getApprovedUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.approvalStatus, "approved"), eq(users.isAdmin, false)));
  }
}

export const storage = new DatabaseStorage();
