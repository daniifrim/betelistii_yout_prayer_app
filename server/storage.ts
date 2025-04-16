import { 
  users, type User, type InsertUser, 
  prayers, type Prayer, type InsertPrayer, 
  quotes, type Quote, type InsertQuote,
  activities, type Activity, type InsertActivity,
  badges, type Badge, type InsertBadge,
  userBadges, type UserBadge, type InsertUserBadge,
  prayerIntentions, type PrayerIntention, type InsertPrayerIntention,
  intentionParticipants, type IntentionParticipant, type InsertIntentionParticipant,
  encouragements, type Encouragement, type InsertEncouragement
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, and, desc, asc } from "drizzle-orm";
import { db, pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Prayer methods
  getPrayer(id: number): Promise<Prayer | undefined>;
  getPrayersByUserId(userId: number): Promise<Prayer[]>;
  getPrayerByUserIdAndDate(userId: number, date: string): Promise<Prayer | undefined>;
  createPrayer(prayer: InsertPrayer): Promise<Prayer>;
  updatePrayer(id: number, prayer: Partial<Prayer>): Promise<Prayer | undefined>;
  deletePrayer(id: number): Promise<boolean>;
  getAllPrayers(): Promise<Prayer[]>;
  
  // Quote methods
  getQuoteByDayOfYear(dayOfYear: number): Promise<Quote | undefined>;
  getAllQuotes(): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<Quote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;
  
  // Activity methods
  getActivity(id: number): Promise<Activity | undefined>;
  getActivitiesByUserId(userId: number): Promise<Activity[]>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  deleteActivity(id: number): Promise<boolean>;
  
  // Badge methods
  getBadge(id: number): Promise<Badge | undefined>;
  getBadgeByType(type: string): Promise<Badge | undefined>;
  getAllBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  
  // User badge methods
  getUserBadge(id: number): Promise<UserBadge | undefined>;
  getUserBadgesByUserId(userId: number): Promise<UserBadge[]>;
  createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  updateUserBadge(id: number, userBadge: Partial<UserBadge>): Promise<UserBadge | undefined>;
  
  // Prayer intention methods
  getPrayerIntention(id: number): Promise<PrayerIntention | undefined>;
  getPrayerIntentionsByUserId(userId: number): Promise<PrayerIntention[]>;
  getActivePrayerIntentions(): Promise<PrayerIntention[]>;
  createPrayerIntention(intention: InsertPrayerIntention): Promise<PrayerIntention>;
  updatePrayerIntention(id: number, intention: Partial<PrayerIntention>): Promise<PrayerIntention | undefined>;
  deletePrayerIntention(id: number): Promise<boolean>;
  
  // Intention participant methods
  getIntentionParticipant(id: number): Promise<IntentionParticipant | undefined>;
  getIntentionParticipantsByIntentionId(intentionId: number): Promise<IntentionParticipant[]>;
  createIntentionParticipant(participant: InsertIntentionParticipant): Promise<IntentionParticipant>;
  deleteIntentionParticipant(id: number): Promise<boolean>;
  
  // Encouragement methods
  getEncouragement(id: number): Promise<Encouragement | undefined>;
  getEncouragementsSent(userId: number): Promise<Encouragement[]>;
  getEncouragementReceived(userId: number): Promise<Encouragement[]>;
  getUnreadEncouragements(userId: number): Promise<Encouragement[]>;
  createEncouragement(encouragement: InsertEncouragement): Promise<Encouragement>;
  markEncouragementAsRead(id: number): Promise<Encouragement | undefined>;
  
  sessionStore: any; // Type as 'any' to avoid session typing issues
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const [deleted] = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!deleted;
  }
  
  // Prayer methods
  async getPrayer(id: number): Promise<Prayer | undefined> {
    const [prayer] = await db.select({
      id: prayers.id,
      userId: prayers.userId,
      date: prayers.date,
      completed: prayers.completed,
      notes: prayers.notes,
      startTime: prayers.startTime,
      endTime: prayers.endTime,
      duration: prayers.duration
    }).from(prayers).where(eq(prayers.id, id));
    return prayer;
  }
  
  async getPrayersByUserId(userId: number): Promise<Prayer[]> {
    return await db.select({
      id: prayers.id,
      userId: prayers.userId,
      date: prayers.date,
      completed: prayers.completed,
      notes: prayers.notes,
      startTime: prayers.startTime,
      endTime: prayers.endTime,
      duration: prayers.duration
    }).from(prayers).where(eq(prayers.userId, userId));
  }
  
  async getPrayerByUserIdAndDate(userId: number, date: string): Promise<Prayer | undefined> {
    const [prayer] = await db.select({
      id: prayers.id,
      userId: prayers.userId,
      date: prayers.date,
      completed: prayers.completed,
      notes: prayers.notes,
      startTime: prayers.startTime,
      endTime: prayers.endTime,
      duration: prayers.duration
    }).from(prayers)
      .where(and(
        eq(prayers.userId, userId),
        eq(prayers.date, date)
      ));
    return prayer;
  }
  
  async createPrayer(insertPrayer: InsertPrayer): Promise<Prayer> {
    const [prayer] = await db.insert(prayers).values(insertPrayer).returning();
    return prayer;
  }
  
  async updatePrayer(id: number, prayerData: Partial<Prayer>): Promise<Prayer | undefined> {
    const [prayer] = await db.update(prayers)
      .set(prayerData)
      .where(eq(prayers.id, id))
      .returning();
    return prayer;
  }
  
  async deletePrayer(id: number): Promise<boolean> {
    const [deleted] = await db.delete(prayers)
      .where(eq(prayers.id, id))
      .returning();
    return !!deleted;
  }
  
  async getAllPrayers(): Promise<Prayer[]> {
    return await db.select({
      id: prayers.id,
      userId: prayers.userId,
      date: prayers.date,
      completed: prayers.completed,
      notes: prayers.notes,
      startTime: prayers.startTime,
      endTime: prayers.endTime,
      duration: prayers.duration
    }).from(prayers);
  }

  // Quote methods
  async getQuoteByDayOfYear(dayOfYear: number): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.dayOfYear, dayOfYear));
    return quote;
  }
  
  async getAllQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes);
  }
  
  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await db.insert(quotes).values(insertQuote).returning();
    return quote;
  }
  
  async updateQuote(id: number, quoteData: Partial<Quote>): Promise<Quote | undefined> {
    const [quote] = await db.update(quotes)
      .set(quoteData)
      .where(eq(quotes.id, id))
      .returning();
    return quote;
  }
  
  async deleteQuote(id: number): Promise<boolean> {
    const [deleted] = await db.delete(quotes)
      .where(eq(quotes.id, id))
      .returning();
    return !!deleted;
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async getActivitiesByUserId(userId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp));
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return await db.select().from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const [deleted] = await db.delete(activities)
      .where(eq(activities.id, id))
      .returning();
    return !!deleted;
  }

  // Badge methods
  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async getBadgeByType(type: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.type, type));
    return badge;
  }

  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }

  // User badge methods
  async getUserBadge(id: number): Promise<UserBadge | undefined> {
    const [userBadge] = await db.select().from(userBadges).where(eq(userBadges.id, id));
    return userBadge;
  }

  async getUserBadgesByUserId(userId: number): Promise<UserBadge[]> {
    return await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  }

  async createUserBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const [newUserBadge] = await db.insert(userBadges).values(userBadge).returning();
    return newUserBadge;
  }

  async updateUserBadge(id: number, userBadge: Partial<UserBadge>): Promise<UserBadge | undefined> {
    const [updatedUserBadge] = await db.update(userBadges)
      .set(userBadge)
      .where(eq(userBadges.id, id))
      .returning();
    return updatedUserBadge;
  }

  // Prayer intention methods
  async getPrayerIntention(id: number): Promise<PrayerIntention | undefined> {
    const [intention] = await db.select().from(prayerIntentions).where(eq(prayerIntentions.id, id));
    return intention;
  }

  async getPrayerIntentionsByUserId(userId: number): Promise<PrayerIntention[]> {
    return await db.select().from(prayerIntentions).where(eq(prayerIntentions.userId, userId))
      .orderBy(desc(prayerIntentions.createdAt));
  }

  async getActivePrayerIntentions(): Promise<PrayerIntention[]> {
    return await db.select().from(prayerIntentions).where(eq(prayerIntentions.active, true))
      .orderBy(desc(prayerIntentions.createdAt));
  }

  async createPrayerIntention(intention: InsertPrayerIntention): Promise<PrayerIntention> {
    const [newIntention] = await db.insert(prayerIntentions).values(intention).returning();
    return newIntention;
  }

  async updatePrayerIntention(id: number, intention: Partial<PrayerIntention>): Promise<PrayerIntention | undefined> {
    const [updatedIntention] = await db.update(prayerIntentions)
      .set(intention)
      .where(eq(prayerIntentions.id, id))
      .returning();
    return updatedIntention;
  }

  async deletePrayerIntention(id: number): Promise<boolean> {
    const [deleted] = await db.delete(prayerIntentions)
      .where(eq(prayerIntentions.id, id))
      .returning();
    return !!deleted;
  }

  // Intention participant methods
  async getIntentionParticipant(id: number): Promise<IntentionParticipant | undefined> {
    const [participant] = await db.select().from(intentionParticipants).where(eq(intentionParticipants.id, id));
    return participant;
  }

  async getIntentionParticipantsByIntentionId(intentionId: number): Promise<IntentionParticipant[]> {
    return await db.select().from(intentionParticipants)
      .where(eq(intentionParticipants.intentionId, intentionId));
  }

  async createIntentionParticipant(participant: InsertIntentionParticipant): Promise<IntentionParticipant> {
    const [newParticipant] = await db.insert(intentionParticipants).values(participant).returning();
    return newParticipant;
  }

  async deleteIntentionParticipant(id: number): Promise<boolean> {
    const [deleted] = await db.delete(intentionParticipants)
      .where(eq(intentionParticipants.id, id))
      .returning();
    return !!deleted;
  }

  // Encouragement methods
  async getEncouragement(id: number): Promise<Encouragement | undefined> {
    const [encouragement] = await db.select().from(encouragements).where(eq(encouragements.id, id));
    return encouragement;
  }

  async getEncouragementsSent(userId: number): Promise<Encouragement[]> {
    return await db.select().from(encouragements)
      .where(eq(encouragements.fromUserId, userId))
      .orderBy(desc(encouragements.timestamp));
  }

  async getEncouragementReceived(userId: number): Promise<Encouragement[]> {
    return await db.select().from(encouragements)
      .where(eq(encouragements.toUserId, userId))
      .orderBy(desc(encouragements.timestamp));
  }

  async getUnreadEncouragements(userId: number): Promise<Encouragement[]> {
    return await db.select().from(encouragements)
      .where(and(
        eq(encouragements.toUserId, userId),
        eq(encouragements.read, false)
      ))
      .orderBy(desc(encouragements.timestamp));
  }

  async createEncouragement(encouragement: InsertEncouragement): Promise<Encouragement> {
    const [newEncouragement] = await db.insert(encouragements).values(encouragement).returning();
    return newEncouragement;
  }

  async markEncouragementAsRead(id: number): Promise<Encouragement | undefined> {
    const [updatedEncouragement] = await db.update(encouragements)
      .set({ read: true })
      .where(eq(encouragements.id, id))
      .returning();
    return updatedEncouragement;
  }
}



// Use the database storage instead of memory storage
export const storage = new DatabaseStorage();
