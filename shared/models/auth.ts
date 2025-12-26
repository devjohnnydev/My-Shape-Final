import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, text, integer, boolean } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // New fields for SaaS
  isAdmin: boolean("is_admin").default(false).notNull(),
  age: integer("age"),
  plan: text("plan"), // TotalPass, GymPass, Direto
  gymId: integer("gym_id"),
  approvalStatus: text("approval_status").default("pending").notNull(), // pending, approved, rejected, blocked
  accessLevel: text("access_level").default("partial").notNull(), // total, partial
  aiChatEnabled: boolean("ai_chat_enabled").default(false).notNull(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
