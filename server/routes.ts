import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertPrayerSchema } from "@shared/schema";
import { format, startOfToday, subDays, parseISO, isValid } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to ensure user is authenticated
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to ensure user is admin
  const ensureAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Forbidden - Admin access required" });
  };

  // Prayer routes
  app.get("/api/prayers", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const prayers = await storage.getPrayersByUserId(userId);
    res.json(prayers);
  });

  app.post("/api/prayers", ensureAuthenticated, async (req, res) => {
    try {
      const prayer = insertPrayerSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // Check if a prayer already exists for this date and user
      const existingPrayer = await storage.getPrayerByUserIdAndDate(req.user!.id, prayer.date);
      if (existingPrayer) {
        const updatedPrayer = await storage.updatePrayer(existingPrayer.id, prayer);
        return res.json(updatedPrayer);
      }
      
      const newPrayer = await storage.createPrayer(prayer);
      res.status(201).json(newPrayer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prayer data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/prayers/:id", ensureAuthenticated, async (req, res) => {
    const prayerId = parseInt(req.params.id);
    const prayer = await storage.getPrayer(prayerId);
    
    if (!prayer) {
      return res.status(404).json({ message: "Prayer not found" });
    }
    
    // Check if the prayer belongs to the current user
    if (prayer.userId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden - You don't have access to this prayer" });
    }
    
    const updatedPrayer = await storage.updatePrayer(prayerId, req.body);
    res.json(updatedPrayer);
  });

  // Toggle today's prayer (mark completed or not)
  app.post("/api/prayers/today", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const existingPrayer = await storage.getPrayerByUserIdAndDate(userId, today);
    
    if (existingPrayer) {
      // Toggle completed status
      const updatedPrayer = await storage.updatePrayer(existingPrayer.id, {
        completed: !existingPrayer.completed
      });
      return res.json(updatedPrayer);
    } else {
      // Create new prayer for today
      const newPrayer = await storage.createPrayer({
        userId,
        date: today,
        completed: true,
        notes: req.body.notes || ""
      });
      return res.status(201).json(newPrayer);
    }
  });

  // Get today's prayer status
  app.get("/api/prayers/today", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const prayer = await storage.getPrayerByUserIdAndDate(userId, today);
    
    if (prayer) {
      res.json(prayer);
    } else {
      res.json({ completed: false, date: today, userId });
    }
  });

  // User stats
  app.get("/api/stats/me", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const prayers = await storage.getPrayersByUserId(userId);
    
    // Count total prayers
    const totalPrayers = prayers.filter(p => p.completed).length;
    
    // Calculate streak
    const sortedPrayers = prayers
      .filter(p => p.completed)
      .map(p => p.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = startOfToday();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      const found = sortedPrayers.includes(checkDate);
      
      if (found) {
        streak++;
      } else if (i === 0) {
        // If today is not completed, check if yesterday was completed
        continue;
      } else {
        // Break streak on first missed day
        break;
      }
    }
    
    // Monthly total
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTotal = prayers.filter(p => {
      const prayerDate = new Date(p.date);
      return p.completed && 
             prayerDate.getMonth() === currentMonth && 
             prayerDate.getFullYear() === currentYear;
    }).length;
    
    res.json({
      streak,
      total: totalPrayers,
      monthlyTotal
    });
  });

  // Team stats and progress
  app.get("/api/stats/team", ensureAuthenticated, async (req, res) => {
    const allUsers = await storage.getAllUsers();
    const allPrayers = await storage.getAllPrayers();
    
    // Calculate completion percentage for each user
    const userStats = await Promise.all(allUsers.map(async (user) => {
      const userPrayers = allPrayers.filter(p => p.userId === user.id);
      
      // Skip over users with no prayers
      if (userPrayers.length === 0) {
        return {
          userId: user.id,
          name: user.name,
          percentage: 0,
          totalCompleted: 0
        };
      }
      
      const completedCount = userPrayers.filter(p => p.completed).length;
      const percentage = Math.round((completedCount / userPrayers.length) * 100);
      
      // Calculate streak
      const sortedPrayers = userPrayers
        .filter(p => p.completed)
        .map(p => p.date)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      let streak = 0;
      const today = startOfToday();
      
      for (let i = 0; i < 365; i++) {
        const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
        const found = sortedPrayers.includes(checkDate);
        
        if (found) {
          streak++;
        } else if (i === 0) {
          // If today is not completed, check if yesterday was completed
          continue;
        } else {
          // Break streak on first missed day
          break;
        }
      }
      
      return {
        userId: user.id,
        name: user.name,
        percentage,
        streak,
        totalCompleted: completedCount
      };
    }));
    
    // Sort by percentage for top performers
    const topByPercentage = [...userStats].sort((a, b) => b.percentage - a.percentage);
    
    // Sort by streak for streak leaders
    const topByStreak = [...userStats].sort((a, b) => b.streak - a.streak);
    
    res.json({
      teamProgress: userStats,
      topPerformers: topByPercentage.slice(0, 3),
      streakLeaders: topByStreak.slice(0, 3)
    });
  });

  // Admin routes
  app.get("/api/admin/users", ensureAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    // Remove password from response
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json(sanitizedUsers);
  });

  app.post("/api/admin/users", ensureAdmin, async (req, res) => {
    try {
      const userExists = await storage.getUserByUsername(req.body.username);
      if (userExists) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password before storing
      const hashedPassword = await (async () => {
        const salt = randomBytes(16).toString("hex");
        const buf = (await promisify(scrypt)(req.body.password, salt, 64)) as Buffer;
        return `${buf.toString("hex")}.${salt}`;
      })();
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword
      });
      
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.patch("/api/admin/users/:id", ensureAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // If updating password, hash it first
    if (req.body.password) {
      req.body.password = await (async () => {
        const salt = randomBytes(16).toString("hex");
        const buf = (await promisify(scrypt)(req.body.password, salt, 64)) as Buffer;
        return `${buf.toString("hex")}.${salt}`;
      })();
    }
    
    const updatedUser = await storage.updateUser(userId, req.body);
    if (updatedUser) {
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });

  app.delete("/api/admin/users/:id", ensureAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    
    // Don't allow deleting the current user
    if (userId === req.user!.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    const success = await storage.deleteUser(userId);
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "User not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
