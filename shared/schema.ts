import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  // For Firebase auth
  firebaseUid: text("firebase_uid").unique(),
});

export const prayers = pgTable("prayers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text("date").notNull(),
  completed: boolean("completed").default(true).notNull(),
  notes: text("notes"),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  prayers: many(prayers),
}));

export const prayersRelations = relations(prayers, ({ one }) => ({
  user: one(users, {
    fields: [prayers.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  isAdmin: true,
  firebaseUid: true,
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
