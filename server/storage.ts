import { users, type User, type InsertUser, prayers, type Prayer, type InsertPrayer, quotes, type Quote, type InsertQuote } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, and } from "drizzle-orm";
import { db, pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  getPrayer(id: number): Promise<Prayer | undefined>;
  getPrayersByUserId(userId: number): Promise<Prayer[]>;
  getPrayerByUserIdAndDate(userId: number, date: string): Promise<Prayer | undefined>;
  createPrayer(prayer: InsertPrayer): Promise<Prayer>;
  updatePrayer(id: number, prayer: Partial<Prayer>): Promise<Prayer | undefined>;
  deletePrayer(id: number): Promise<boolean>;
  
  getAllPrayers(): Promise<Prayer[]>;
  
  getQuoteByDayOfYear(dayOfYear: number): Promise<Quote | undefined>;
  getAllQuotes(): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<Quote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;
  
  sessionStore: any; // Type as 'any' to avoid session typing issues
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private prayers: Map<number, Prayer>;
  private quotes: Map<number, Quote>;
  sessionStore: any;
  userCurrentId: number;
  prayerCurrentId: number;
  quoteCurrentId: number;

  constructor() {
    this.users = new Map();
    this.prayers = new Map();
    this.quotes = new Map();
    this.userCurrentId = 1;
    this.prayerCurrentId = 1;
    this.quoteCurrentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

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
    // Ensure default values are set for required fields
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false, 
      firebaseUid: insertUser.firebaseUid ?? null
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
    return prayer;
  }
  
  async updatePrayer(id: number, prayerData: Partial<Prayer>): Promise<Prayer | undefined> {
    const prayer = await this.getPrayer(id);
    if (!prayer) return undefined;
    
    const updatedPrayer = { ...prayer, ...prayerData };
    this.prayers.set(id, updatedPrayer);
    return updatedPrayer;
  }
  
  async deletePrayer(id: number): Promise<boolean> {
    return this.prayers.delete(id);
  }
  
  async getAllPrayers(): Promise<Prayer[]> {
    return Array.from(this.prayers.values());
  }

  async getQuoteByDayOfYear(dayOfYear: number): Promise<Quote | undefined> {
    return Array.from(this.quotes.values()).find(
      (quote) => quote.dayOfYear === dayOfYear
    );
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
    const quote = this.quotes.get(id);
    if (!quote) return undefined;
    
    const updatedQuote = { ...quote, ...quoteData };
    this.quotes.set(id, updatedQuote);
    return updatedQuote;
  }
  
  async deleteQuote(id: number): Promise<boolean> {
    return this.quotes.delete(id);
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
    return await db.select().from(prayers);
  }

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
}

// Use the database storage instead of memory storage
export const storage = new DatabaseStorage();
