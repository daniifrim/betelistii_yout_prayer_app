import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const prayers = pgTable("prayers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  completed: boolean("completed").default(true).notNull(),
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  isAdmin: true,
});

export const insertPrayerSchema = createInsertSchema(prayers).pick({
  userId: true,
  date: true,
  completed: true,
  notes: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPrayer = z.infer<typeof insertPrayerSchema>;
export type User = typeof users.$inferSelect;
export type Prayer = typeof prayers.$inferSelect;
