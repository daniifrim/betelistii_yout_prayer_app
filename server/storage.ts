import { users, type User, type InsertUser, prayers, type Prayer, type InsertPrayer } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private prayers: Map<number, Prayer>;
  sessionStore: session.SessionStore;
  userCurrentId: number;
  prayerCurrentId: number;

  constructor() {
    this.users = new Map();
    this.prayers = new Map();
    this.userCurrentId = 1;
    this.prayerCurrentId = 1;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
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
    const prayer: Prayer = { ...insertPrayer, id };
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
}

export const storage = new MemStorage();
