import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
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
  // Streak and achievements tracking
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  totalPrayers: integer("total_prayers").default(0).notNull(),
  lastPrayerDate: text("last_prayer_date"),
  // Notification preferences
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  notificationTime: text("notification_time").default("09:00").notNull(),
  // Earned badges
  badges: jsonb("badges").$type<string[]>().default([]).notNull(),
});

export const prayers = pgTable("prayers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text("date").notNull(),
  completed: boolean("completed").default(true).notNull(),
  notes: text("notes"),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  criteria: text("criteria").notNull(),
  iconPath: text("icon_path").notNull(),
  requiredCount: integer("required_count").notNull(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  author: text("author"),
  source: text("source"),
  category: text("category"),
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

// Add new relations
export const badgesRelations = relations(badges, ({ many }) => ({}));

export const quotesRelations = relations(quotes, ({ many }) => ({}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  isAdmin: true,
  firebaseUid: true,
  notificationsEnabled: true,
  notificationTime: true,
});

export const insertPrayerSchema = createInsertSchema(prayers).pick({
  userId: true,
  date: true,
  completed: true,
  notes: true,
});

export const insertBadgeSchema = createInsertSchema(badges).pick({
  name: true,
  description: true,
  criteria: true,
  iconPath: true,
  requiredCount: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).pick({
  text: true,
  author: true,
  source: true,
  category: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPrayer = z.infer<typeof insertPrayerSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type User = typeof users.$inferSelect;
export type Prayer = typeof prayers.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
