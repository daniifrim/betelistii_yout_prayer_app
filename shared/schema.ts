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
  photoURL: text("photo_url"),
});

export const prayers = pgTable("prayers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text("date").notNull(),
  completed: boolean("completed").default(true).notNull(),
  notes: text("notes"),
  // New fields for prayer tracking
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // Duration in seconds
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  text_en: text("text_en"),
  author: text("author").notNull(),
  source: text("source"),
  dayOfYear: integer("day_of_year").notNull().unique(),
});

// Activity feed for group engagement
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text("type").notNull(), // 'prayer', 'encouragement', 'achievement', etc.
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  relatedUserId: integer("related_user_id").references(() => users.id), // Used for encouragements
  relatedPrayerId: integer("related_prayer_id").references(() => prayers.id),
  relatedBadgeId: integer("related_badge_id").references(() => badges.id),
});

// Badges and achievements system
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // SVG or icon name
  type: text("type").notNull(), // 'morning_watch', 'evening_sacrifice', 'forerunner', 'faithful_servant', etc.
});

// User badges relationship
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: integer("badge_id").notNull().references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  displayed: boolean("displayed").default(true).notNull(),
});

// Prayer intentions for sharing
export const prayerIntentions = pgTable("prayer_intentions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
});

// User joining others' prayer intentions
export const intentionParticipants = pgTable("intention_participants", {
  id: serial("id").primaryKey(),
  intentionId: integer("intention_id").notNull().references(() => prayerIntentions.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Encouragements between users
export const encouragements = pgTable("encouragements", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  toUserId: integer("to_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  read: boolean("read").default(false).notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  prayers: many(prayers),
  sentEncouragements: many(encouragements, { relationName: "sentEncouragements" }),
  receivedEncouragements: many(encouragements, { relationName: "receivedEncouragements" }),
  userBadges: many(userBadges),
  activities: many(activities),
  prayerIntentions: many(prayerIntentions),
}));

export const prayersRelations = relations(prayers, ({ one }) => ({
  user: one(users, {
    fields: [prayers.userId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  relatedUser: one(users, {
    fields: [activities.relatedUserId],
    references: [users.id],
  }),
  relatedPrayer: one(prayers, {
    fields: [activities.relatedPrayerId],
    references: [prayers.id],
  }),
  relatedBadge: one(badges, {
    fields: [activities.relatedBadgeId],
    references: [badges.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const encouragementsRelations = relations(encouragements, ({ one }) => ({
  fromUser: one(users, {
    fields: [encouragements.fromUserId],
    references: [users.id],
    relationName: "sentEncouragements",
  }),
  toUser: one(users, {
    fields: [encouragements.toUserId],
    references: [users.id],
    relationName: "receivedEncouragements",
  }),
}));

export const prayerIntentionsRelations = relations(prayerIntentions, ({ one, many }) => ({
  user: one(users, {
    fields: [prayerIntentions.userId],
    references: [users.id],
  }),
  participants: many(intentionParticipants),
}));

export const intentionParticipantsRelations = relations(intentionParticipants, ({ one }) => ({
  intention: one(prayerIntentions, {
    fields: [intentionParticipants.intentionId],
    references: [prayerIntentions.id],
  }),
  user: one(users, {
    fields: [intentionParticipants.userId],
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
  photoURL: true,
});

export const insertPrayerSchema = createInsertSchema(prayers).pick({
  userId: true,
  date: true,
  completed: true,
  notes: true,
  startTime: true,
  endTime: true,
  duration: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).pick({
  text: true,
  text_en: true,
  author: true,
  source: true,
  dayOfYear: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  type: true,
  content: true,
  relatedUserId: true,
  relatedPrayerId: true,
  relatedBadgeId: true,
});

export const insertBadgeSchema = createInsertSchema(badges).pick({
  name: true,
  description: true,
  icon: true,
  type: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).pick({
  userId: true,
  badgeId: true,
  displayed: true,
});

export const insertPrayerIntentionSchema = createInsertSchema(prayerIntentions).pick({
  userId: true,
  title: true,
  description: true,
  active: true,
});

export const insertIntentionParticipantSchema = createInsertSchema(intentionParticipants).pick({
  intentionId: true,
  userId: true,
});

export const insertEncouragementSchema = createInsertSchema(encouragements).pick({
  fromUserId: true,
  toUserId: true,
  message: true,
  read: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPrayer = z.infer<typeof insertPrayerSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type InsertPrayerIntention = z.infer<typeof insertPrayerIntentionSchema>;
export type InsertIntentionParticipant = z.infer<typeof insertIntentionParticipantSchema>;
export type InsertEncouragement = z.infer<typeof insertEncouragementSchema>;

export type User = typeof users.$inferSelect;
export type Prayer = typeof prayers.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type PrayerIntention = typeof prayerIntentions.$inferSelect;
export type IntentionParticipant = typeof intentionParticipants.$inferSelect;
export type Encouragement = typeof encouragements.$inferSelect;
