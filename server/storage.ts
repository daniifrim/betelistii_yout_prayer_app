import { 
  users, type User, type InsertUser, 
  prayers, type Prayer, type InsertPrayer,
  badges, type Badge, type InsertBadge,
  quotes, type Quote, type InsertQuote
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, and, sql } from "drizzle-orm";
import { db, pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  updateUserStreak(userId: number, date: string, completed: boolean): Promise<User | undefined>;
  addBadgeToUser(userId: number, badgeName: string): Promise<User | undefined>;
  
  // Prayer operations
  getPrayer(id: number): Promise<Prayer | undefined>;
  getPrayersByUserId(userId: number): Promise<Prayer[]>;
  getPrayerByUserIdAndDate(userId: number, date: string): Promise<Prayer | undefined>;
  createPrayer(prayer: InsertPrayer): Promise<Prayer>;
  updatePrayer(id: number, prayer: Partial<Prayer>): Promise<Prayer | undefined>;
  deletePrayer(id: number): Promise<boolean>;
  getAllPrayers(): Promise<Prayer[]>;
  
  // Badge operations
  getBadge(id: number): Promise<Badge | undefined>;
  getBadgeByName(name: string): Promise<Badge | undefined>;
  getAllBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: number, badge: Partial<Badge>): Promise<Badge | undefined>;
  deleteBadge(id: number): Promise<boolean>;
  
  // Quote operations
  getRandomQuote(category?: string): Promise<Quote | undefined>;
  getAllQuotes(): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<Quote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;
  
  sessionStore: any; // Type as 'any' to avoid session typing issues
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private prayers: Map<number, Prayer>;
  private badges: Map<number, Badge>;
  private quotes: Map<number, Quote>;
  sessionStore: any;
  userCurrentId: number;
  prayerCurrentId: number;
  badgeCurrentId: number;
  quoteCurrentId: number;

  constructor() {
    this.users = new Map();
    this.prayers = new Map();
    this.badges = new Map();
    this.quotes = new Map();
    this.userCurrentId = 1;
    this.prayerCurrentId = 1;
    this.badgeCurrentId = 1;
    this.quoteCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with some default badges
    this.seedDefaultBadges();
    // Initialize with some default quotes
    this.seedDefaultQuotes();
  }

  // USER METHODS
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    // Ensure default values are set for all required fields
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false, 
      firebaseUid: insertUser.firebaseUid ?? null,
      currentStreak: 0,
      longestStreak: 0,
      totalPrayers: 0,
      lastPrayerDate: null,
      notificationsEnabled: insertUser.notificationsEnabled ?? true,
      notificationTime: insertUser.notificationTime ?? "09:00",
      badges: [],
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async updateUserStreak(userId: number, date: string, completed: boolean): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    if (completed) {
      // Check if this is consecutive with the last prayer
      const isConsecutiveDay = this.isConsecutiveDay(user.lastPrayerDate || '', date);
      
      // Calculate new streak value
      let newStreak = isConsecutiveDay ? user.currentStreak + 1 : 1;
      let longestStreak = Math.max(user.longestStreak, newStreak);
      let totalPrayers = user.totalPrayers + 1;
      
      // Update the user 
      const updatedUser = await this.updateUser(userId, {
        currentStreak: newStreak,
        longestStreak,
        totalPrayers,
        lastPrayerDate: date
      });
      
      return updatedUser;
    } else {
      // If prayer was not completed, reset the streak
      return await this.updateUser(userId, {
        currentStreak: 0
      });
    }
  }
  
  async addBadgeToUser(userId: number, badgeName: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Check if the user already has this badge
    if (user.badges && user.badges.includes(badgeName)) {
      return user;
    }
    
    // Add the badge to the user's badges array
    const updatedBadges = [...(user.badges || []), badgeName];
    
    // Update the user
    return await this.updateUser(userId, {
      badges: updatedBadges
    });
  }
  
  // PRAYER METHODS
  async getPrayer(id: number): Promise<Prayer | undefined> {
    return this.prayers.get(id);
  }
  
  async getPrayersByUserId(userId: number): Promise<Prayer[]> {
    return Array.from(this.prayers.values()).filter(
      (prayer) => prayer.userId === userId,
    );
  }
  
  async getPrayerByUserIdAndDate(userId: number, date: string): Promise<Prayer | undefined> {
    return Array.from(this.prayers.values()).find(
      (prayer) => prayer.userId === userId && prayer.date === date,
    );
  }
  
  async createPrayer(insertPrayer: InsertPrayer): Promise<Prayer> {
    const id = this.prayerCurrentId++;
    // Ensure default values are set for required fields
    const prayer: Prayer = { 
      ...insertPrayer, 
      id,
      completed: insertPrayer.completed ?? true,
      notes: insertPrayer.notes ?? null
    };
    this.prayers.set(id, prayer);
    
    // After creating a prayer, update the user's streak and check for badges
    await this.updateUserStreak(prayer.userId, prayer.date, prayer.completed);
    await this.checkAndAwardBadges(prayer.userId);
    
    return prayer;
  }
  
  async updatePrayer(id: number, prayerData: Partial<Prayer>): Promise<Prayer | undefined> {
    const prayer = await this.getPrayer(id);
    if (!prayer) return undefined;
    
    const updatedPrayer = { ...prayer, ...prayerData };
    this.prayers.set(id, updatedPrayer);
    
    if (prayerData.completed !== undefined) {
      // Update the user's streak if the prayer completion status changed
      await this.updateUserStreak(prayer.userId, prayer.date, prayerData.completed);
      await this.checkAndAwardBadges(prayer.userId);
    }
    
    return updatedPrayer;
  }
  
  async deletePrayer(id: number): Promise<boolean> {
    return this.prayers.delete(id);
  }
  
  async getAllPrayers(): Promise<Prayer[]> {
    return Array.from(this.prayers.values());
  }
  
  // BADGE METHODS
  async getBadge(id: number): Promise<Badge | undefined> {
    return this.badges.get(id);
  }
  
  async getBadgeByName(name: string): Promise<Badge | undefined> {
    return Array.from(this.badges.values()).find(
      (badge) => badge.name === name,
    );
  }
  
  async getAllBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }
  
  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const id = this.badgeCurrentId++;
    const badge: Badge = { 
      ...insertBadge, 
      id
    };
    this.badges.set(id, badge);
    return badge;
  }
  
  async updateBadge(id: number, badgeData: Partial<Badge>): Promise<Badge | undefined> {
    const badge = await this.getBadge(id);
    if (!badge) return undefined;
    
    const updatedBadge = { ...badge, ...badgeData };
    this.badges.set(id, updatedBadge);
    return updatedBadge;
  }
  
  async deleteBadge(id: number): Promise<boolean> {
    return this.badges.delete(id);
  }
  
  // QUOTE METHODS
  async getRandomQuote(category?: string): Promise<Quote | undefined> {
    const quotes = Array.from(this.quotes.values());
    let filteredQuotes = quotes;
    
    if (category) {
      filteredQuotes = quotes.filter(quote => quote.category === category);
    }
    
    if (filteredQuotes.length === 0) {
      return undefined;
    }
    
    // Get a random quote
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    return filteredQuotes[randomIndex];
  }
  
  async getAllQuotes(): Promise<Quote[]> {
    return Array.from(this.quotes.values());
  }
  
  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const id = this.quoteCurrentId++;
    const quote: Quote = { 
      ...insertQuote, 
      id
    };
    this.quotes.set(id, quote);
    return quote;
  }
  
  async updateQuote(id: number, quoteData: Partial<Quote>): Promise<Quote | undefined> {
    const quote = await this.getQuote(id);
    if (!quote) return undefined;
    
    const updatedQuote = { ...quote, ...quoteData };
    this.quotes.set(id, updatedQuote);
    return updatedQuote;
  }
  
  async deleteQuote(id: number): Promise<boolean> {
    return this.quotes.delete(id);
  }
  
  // HELPER METHODS
  private isConsecutiveDay(lastDate: string, currentDate: string): boolean {
    if (!lastDate) return false;
    
    const lastDateObj = new Date(lastDate);
    const currentDateObj = new Date(currentDate);
    
    // Reset hours to compare only dates
    lastDateObj.setHours(0, 0, 0, 0);
    currentDateObj.setHours(0, 0, 0, 0);
    
    // Get time difference in days
    const timeDiff = currentDateObj.getTime() - lastDateObj.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24);
    
    // Check if it's the next day (1 day difference)
    return dayDiff === 1;
  }
  
  private async checkAndAwardBadges(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    // Get all available badges
    const allBadges = await this.getAllBadges();
    
    // Check each badge's criteria
    for (const badge of allBadges) {
      // Skip if user already has this badge
      if (user.badges.includes(badge.name)) {
        continue;
      }
      
      // Check if user meets the criteria
      switch (badge.criteria) {
        case 'streak':
          if (user.currentStreak >= badge.requiredCount) {
            await this.addBadgeToUser(userId, badge.name);
          }
          break;
        case 'total_prayers':
          if (user.totalPrayers >= badge.requiredCount) {
            await this.addBadgeToUser(userId, badge.name);
          }
          break;
        case 'longest_streak':
          if (user.longestStreak >= badge.requiredCount) {
            await this.addBadgeToUser(userId, badge.name);
          }
          break;
      }
    }
  }
  
  private async getQuote(id: number): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }
  
  private async seedDefaultBadges(): Promise<void> {
    // Create default badges
    await this.createBadge({
      name: 'First Prayer',
      description: 'Completed your first prayer',
      criteria: 'total_prayers',
      iconPath: '/badges/first-prayer.svg',
      requiredCount: 1
    });
    
    await this.createBadge({
      name: '3-Day Streak',
      description: 'Maintained a 3-day prayer streak',
      criteria: 'streak',
      iconPath: '/badges/3-day-streak.svg',
      requiredCount: 3
    });
    
    await this.createBadge({
      name: '7-Day Streak',
      description: 'Maintained a 7-day prayer streak',
      criteria: 'streak',
      iconPath: '/badges/7-day-streak.svg',
      requiredCount: 7
    });
    
    await this.createBadge({
      name: '30-Day Streak',
      description: 'Maintained a 30-day prayer streak',
      criteria: 'streak',
      iconPath: '/badges/30-day-streak.svg',
      requiredCount: 30
    });
    
    await this.createBadge({
      name: 'Prayer Warrior',
      description: 'Completed 100 prayers',
      criteria: 'total_prayers',
      iconPath: '/badges/prayer-warrior.svg',
      requiredCount: 100
    });
  }
  
  private async seedDefaultQuotes(): Promise<void> {
    // Create some inspirational prayer quotes
    await this.createQuote({
      text: "Prayer is not asking. It is a longing of the soul.",
      author: "Mahatma Gandhi",
      source: null,
      category: "inspiration"
    });
    
    await this.createQuote({
      text: "Prayer does not change God, but it changes him who prays.",
      author: "Søren Kierkegaard",
      source: null,
      category: "inspiration"
    });
    
    await this.createQuote({
      text: "The function of prayer is not to influence God, but rather to change the nature of the one who prays.",
      author: "Søren Kierkegaard",
      source: null,
      category: "inspiration"
    });
    
    await this.createQuote({
      text: "Prayer is the key of the morning and the bolt of the evening.",
      author: "Mahatma Gandhi",
      source: null,
      category: "morning"
    });
    
    await this.createQuote({
      text: "I have so much to do today that I shall spend the first three hours in prayer.",
      author: "Martin Luther",
      source: null,
      category: "morning"
    });
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // USER METHODS
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

  async updateUserStreak(userId: number, date: string, completed: boolean): Promise<User | undefined> {
    // Get the user to update their streak
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // If prayer was completed, update the streak and potentially add badges
    if (completed) {
      // Check if this is consecutive with the last prayer
      const isConsecutiveDay = this.isConsecutiveDay(user.lastPrayerDate || '', date);
      
      // Calculate new streak value
      let newStreak = isConsecutiveDay ? user.currentStreak + 1 : 1;
      let longestStreak = Math.max(user.longestStreak, newStreak);
      let totalPrayers = user.totalPrayers + 1;
      
      // Update the user record
      const [updatedUser] = await db.update(users)
        .set({
          currentStreak: newStreak,
          longestStreak,
          totalPrayers,
          lastPrayerDate: date
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } else {
      // If prayer was not completed, reset the streak
      const [updatedUser] = await db.update(users)
        .set({
          currentStreak: 0
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    }
  }
  
  async addBadgeToUser(userId: number, badgeName: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Check if the user already has this badge
    if (user.badges && user.badges.includes(badgeName)) {
      return user;
    }
    
    // Add the badge to the user's badges array
    const updatedBadges = [...(user.badges || []), badgeName];
    
    // Update the user record
    const [updatedUser] = await db.update(users)
      .set({
        badges: updatedBadges
      })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
  
  // PRAYER METHODS
  async getPrayer(id: number): Promise<Prayer | undefined> {
    const [prayer] = await db.select().from(prayers).where(eq(prayers.id, id));
    return prayer;
  }
  
  async getPrayersByUserId(userId: number): Promise<Prayer[]> {
    return await db.select().from(prayers).where(eq(prayers.userId, userId));
  }
  
  async getPrayerByUserIdAndDate(userId: number, date: string): Promise<Prayer | undefined> {
    const [prayer] = await db.select().from(prayers)
      .where(and(
        eq(prayers.userId, userId),
        eq(prayers.date, date)
      ));
    return prayer;
  }
  
  async createPrayer(insertPrayer: InsertPrayer): Promise<Prayer> {
    const [prayer] = await db.insert(prayers).values(insertPrayer).returning();
    
    // After creating a prayer, update the user's streak and check for badges
    await this.updateUserStreak(prayer.userId, prayer.date, prayer.completed);
    await this.checkAndAwardBadges(prayer.userId);
    
    return prayer;
  }
  
  async updatePrayer(id: number, prayerData: Partial<Prayer>): Promise<Prayer | undefined> {
    const [prayer] = await db.update(prayers)
      .set(prayerData)
      .where(eq(prayers.id, id))
      .returning();
    
    if (prayer && prayerData.completed !== undefined) {
      // Update the user's streak if the prayer completion status changed
      await this.updateUserStreak(prayer.userId, prayer.date, prayerData.completed);
      await this.checkAndAwardBadges(prayer.userId);
    }
    
    return prayer;
  }
  
  async deletePrayer(id: number): Promise<boolean> {
    const [deleted] = await db.delete(prayers)
      .where(eq(prayers.id, id))
      .returning();
    return !!deleted;
  }
  
  async getAllPrayers(): Promise<Prayer[]> {
    return await db.select().from(prayers);
  }
  
  // BADGE METHODS
  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }
  
  async getBadgeByName(name: string): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.name, name));
    return badge;
  }
  
  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }
  
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db.insert(badges).values(badge).returning();
    return newBadge;
  }
  
  async updateBadge(id: number, badgeData: Partial<Badge>): Promise<Badge | undefined> {
    const [badge] = await db.update(badges)
      .set(badgeData)
      .where(eq(badges.id, id))
      .returning();
    return badge;
  }
  
  async deleteBadge(id: number): Promise<boolean> {
    const [deleted] = await db.delete(badges)
      .where(eq(badges.id, id))
      .returning();
    return !!deleted;
  }
  
  // QUOTE METHODS
  async getRandomQuote(category?: string): Promise<Quote | undefined> {
    let query = db.select().from(quotes);
    
    if (category) {
      query = query.where(eq(quotes.category, category));
    }
    
    // Add ORDER BY RANDOM() to get a random quote
    const randomQuotes = await query.limit(1);
    return randomQuotes[0];
  }
  
  async getAllQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes);
  }
  
  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db.insert(quotes).values(quote).returning();
    return newQuote;
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
  
  // HELPER METHODS
  private isConsecutiveDay(lastDate: string, currentDate: string): boolean {
    if (!lastDate) return false;
    
    const lastDateObj = new Date(lastDate);
    const currentDateObj = new Date(currentDate);
    
    // Reset hours to compare only dates
    lastDateObj.setHours(0, 0, 0, 0);
    currentDateObj.setHours(0, 0, 0, 0);
    
    // Get time difference in days
    const timeDiff = currentDateObj.getTime() - lastDateObj.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24);
    
    // Check if it's the next day (1 day difference)
    return dayDiff === 1;
  }
  
  private async checkAndAwardBadges(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    // Get all available badges
    const allBadges = await this.getAllBadges();
    
    // Check each badge's criteria
    for (const badge of allBadges) {
      // Skip if user already has this badge
      if (user.badges && user.badges.includes(badge.name)) {
        continue;
      }
      
      // Check if user meets the criteria
      switch (badge.criteria) {
        case 'streak':
          if (user.currentStreak >= badge.requiredCount) {
            await this.addBadgeToUser(userId, badge.name);
          }
          break;
        case 'total_prayers':
          if (user.totalPrayers >= badge.requiredCount) {
            await this.addBadgeToUser(userId, badge.name);
          }
          break;
        case 'longest_streak':
          if (user.longestStreak >= badge.requiredCount) {
            await this.addBadgeToUser(userId, badge.name);
          }
          break;
      }
    }
  }
}

// Use the database storage instead of memory storage
export const storage = new DatabaseStorage();
