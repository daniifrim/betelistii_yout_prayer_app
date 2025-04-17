import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { insertPrayerSchema, insertQuoteSchema } from "@shared/schema";
import { format, startOfToday, subDays, parseISO, isValid, getDayOfYear } from "date-fns";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

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

  // Toggle today's prayer (mark completed or not) with optional timing data
  app.post("/api/prayers/today", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Extraer datos de temporización si están presentes
    const { startTime, endTime, duration } = req.body;
    
    const existingPrayer = await storage.getPrayerByUserIdAndDate(userId, today);
    
    if (existingPrayer) {
      // Si hay datos de tiempo, actualizar con esos datos
      if (startTime && endTime && duration) {
        const updatedPrayer = await storage.updatePrayer(existingPrayer.id, {
          completed: true, // Siempre marcar como completada si hay datos de tiempo
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          duration
        });
        return res.json(updatedPrayer);
      } else {
        // Si no hay datos de tiempo, simplemente alternar el estado
        const updatedPrayer = await storage.updatePrayer(existingPrayer.id, {
          completed: !existingPrayer.completed
        });
        return res.json(updatedPrayer);
      }
    } else {
      // Crear nueva oración para hoy
      const prayerData: any = {
        userId,
        date: today,
        completed: true,
        notes: req.body.notes || ""
      };
      
      // Añadir datos de tiempo si están presentes
      if (startTime && endTime && duration) {
        prayerData.startTime = new Date(startTime);
        prayerData.endTime = new Date(endTime);
        prayerData.duration = duration;
      }
      
      const newPrayer = await storage.createPrayer(prayerData);
      return res.status(201).json(newPrayer);
    }
  });
  
  // Toggle prayer for a specific date (mark completed or not) with optional timing data
  app.post("/api/prayers/date/:date", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const date = req.params.date;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date format. Expected yyyy-MM-dd" });
    }
    
    // Check if date is in the future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      return res.status(400).json({ message: "Cannot update prayer status for future dates" });
    }
    
    // Extraer datos de temporización si están presentes
    const { startTime, endTime, duration } = req.body;
    
    const existingPrayer = await storage.getPrayerByUserIdAndDate(userId, date);
    
    if (existingPrayer) {
      // Si hay datos de tiempo, actualizar con esos datos
      if (startTime && endTime && duration) {
        const updatedPrayer = await storage.updatePrayer(existingPrayer.id, {
          completed: true, // Siempre marcar como completada si hay datos de tiempo
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          duration
        });
        return res.json(updatedPrayer);
      } else {
        // Si no hay datos de tiempo, simplemente alternar el estado
        const updatedPrayer = await storage.updatePrayer(existingPrayer.id, {
          completed: !existingPrayer.completed
        });
        return res.json(updatedPrayer);
      }
    } else {
      // Crear nueva oración para la fecha especificada
      const prayerData: any = {
        userId,
        date,
        completed: true,
        notes: req.body.notes || ""
      };
      
      // Añadir datos de tiempo si están presentes
      if (startTime && endTime && duration) {
        prayerData.startTime = new Date(startTime);
        prayerData.endTime = new Date(endTime);
        prayerData.duration = duration;
      }
      
      const newPrayer = await storage.createPrayer(prayerData);
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
  
  // Get prayer status for a specific date
  app.get("/api/prayers/date/:date", ensureAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const date = req.params.date;
    
    // Validate date format (yyyy-MM-dd)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date format. Expected yyyy-MM-dd" });
    }
    
    const prayer = await storage.getPrayerByUserIdAndDate(userId, date);
    
    if (prayer) {
      res.json(prayer);
    } else {
      res.json({ completed: false, date, userId });
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
    const topByStreak = [...userStats].sort((a, b) => (b.streak || 0) - (a.streak || 0));
    
    res.json({
      teamProgress: userStats,
      topPerformers: topByPercentage.slice(0, 3),
      streakLeaders: topByStreak.slice(0, 3)
    });
  });

  // Activities routes
  // Get recent activities
  app.get("/api/activities/recent", ensureAuthenticated, async (req, res) => {
    const recentActivities = await storage.getRecentActivities(20); // Obtener las 20 actividades más recientes
    res.json(recentActivities);
  });
  
  // Create a new activity
  app.post("/api/activities", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const activity = await storage.createActivity({
        userId,
        type: req.body.type,
        content: req.body.content,
        relatedUserId: req.body.relatedUserId || null,
        relatedPrayerId: req.body.relatedPrayerId || null,
        relatedBadgeId: req.body.relatedBadgeId || null
      });
      
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ message: "Error al crear la actividad" });
    }
  });
  
  // Get all users (basic info)
  app.get("/api/users", ensureAuthenticated, async (req, res) => {
    const users = await storage.getAllUsers();
    // Remove password from response and other sensitive data
    const sanitizedUsers = users.map(({ password, email, isAdmin, ...user }) => user);
    res.json(sanitizedUsers);
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

  // Quotes routes
  // Get today's quote
  app.get("/api/quotes/today", async (req, res) => {
    const today = new Date();
    const dayOfYear = getDayOfYear(today);
    
    // Para que las citas se repartan a lo largo del año, usamos mod 100
    const adjustedDayOfYear = ((dayOfYear - 1) % 100) + 1;
    
    console.log('Fecha actual:', today);
    console.log('Día del año original:', dayOfYear);
    console.log('Día del año ajustado:', adjustedDayOfYear);
    
    const quote = await storage.getQuoteByDayOfYear(adjustedDayOfYear);
    console.log('Cita encontrada:', quote);
    
    if (quote) {
      res.json(quote);
    } else {
      // Return a default quote if none exists for today
      const defaultQuote = { 
        id: 0,
        text: "Cada día es una nueva oportunidad para acercarse a Dios.",
        author: "Betelistii",
        dayOfYear: adjustedDayOfYear
      };
      console.log('Retornando cita por defecto:', defaultQuote);
      res.json(defaultQuote);
    }
  });
  
  // Import quotes endpoint (admin only)
  app.post("/api/admin/import-quotes", ensureAdmin, async (req, res) => {
    try {
      const quotes = req.body.quotes;
      
      if (!Array.isArray(quotes)) {
        return res.status(400).json({ message: "Se esperaba un array de citas" });
      }
      
      let importedCount = 0;
      
      for (let i = 0; i < quotes.length; i++) {
        const quote = quotes[i];
        const dayOfYear = i + 1;
        
        // Check if a quote already exists for this day
        const existingQuote = await storage.getQuoteByDayOfYear(dayOfYear);
        
        if (existingQuote) {
          // Update existing quote
          await storage.updateQuote(existingQuote.id, {
            text: quote.quote_es || quote.text,
            text_en: quote.quote_en,
            author: "Mark Batterson",
            source: quote.source,
            dayOfYear: dayOfYear
          });
        } else {
          // Create new quote
          await storage.createQuote({
            text: quote.quote_es || quote.text,
            text_en: quote.quote_en,
            author: "Mark Batterson",
            source: quote.source,
            dayOfYear: dayOfYear
          });
        }
        
        importedCount++;
      }
      
      res.json({ 
        message: `${importedCount} citas importadas con éxito`,
        count: importedCount
      });
    } catch (error) {
      console.error("Error al importar citas:", error);
      res.status(500).json({ message: "Error al importar citas" });
    }
  });

  // Admin quote management routes
  app.get("/api/admin/quotes", ensureAdmin, async (req, res) => {
    const quotes = await storage.getAllQuotes();
    res.json(quotes);
  });

  app.post("/api/admin/quotes", ensureAdmin, async (req, res) => {
    try {
      const quote = insertQuoteSchema.parse(req.body);
      
      // Check if a quote already exists for this day of year
      const existingQuote = await storage.getQuoteByDayOfYear(quote.dayOfYear);
      if (existingQuote) {
        return res.status(400).json({ 
          message: "Ya existe una cita para este día del año" 
        });
      }
      
      const newQuote = await storage.createQuote(quote);
      res.status(201).json(newQuote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Datos de cita inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error del servidor" });
    }
  });

  app.patch("/api/admin/quotes/:id", ensureAdmin, async (req, res) => {
    const quoteId = parseInt(req.params.id);
    
    // If updating dayOfYear, check if it's not already used
    if (req.body.dayOfYear) {
      const existingQuote = await storage.getQuoteByDayOfYear(req.body.dayOfYear);
      if (existingQuote && existingQuote.id !== quoteId) {
        return res.status(400).json({ 
          message: "Ya existe una cita para este día del año" 
        });
      }
    }
    
    const updatedQuote = await storage.updateQuote(quoteId, req.body);
    if (updatedQuote) {
      res.json(updatedQuote);
    } else {
      res.status(404).json({ message: "Cita no encontrada" });
    }
  });

  app.delete("/api/admin/quotes/:id", ensureAdmin, async (req, res) => {
    const quoteId = parseInt(req.params.id);
    const success = await storage.deleteQuote(quoteId);
    
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Cita no encontrada" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
