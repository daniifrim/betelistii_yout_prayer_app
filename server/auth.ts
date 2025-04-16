import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { auth as firebaseAuth } from "./firebase-admin";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Function to verify Firebase token
async function verifyFirebaseToken(idToken: string): Promise<any | null> {
  try {
    return await firebaseAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return null;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'prayer-tracker-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // Traditional registration
  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  // Traditional login
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  // Firebase Google authentication
  app.post("/api/auth/google", async (req, res, next) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        console.error("No ID token provided in request");
        return res.status(400).json({ message: "No ID token provided" });
      }

      console.log("Verifying Firebase token...");
      
      // Verify the Firebase token
      const decodedToken = await verifyFirebaseToken(idToken);
      if (!decodedToken) {
        console.error("Invalid Firebase token");
        return res.status(401).json({ message: "Invalid Firebase token" });
      }

      // Get the user's info from the token
      const { uid } = decodedToken;
      const email = decodedToken.email || '';
      const displayName = decodedToken.name || decodedToken.displayName || '';
      
      console.log(`Firebase user authenticated: ${displayName} (${email}), UID: ${uid}`);
      
      // Check if the user exists in our database by Firebase UID
      let user = await storage.getUserByFirebaseUid(uid);
      
      if (!user) {
        console.log(`Creating new user for Firebase UID: ${uid}`);
        
        // User doesn't exist in our system yet, create a new account
        // Generate a random password (they'll use Google auth anyway)
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await hashPassword(randomPassword);
        
        // Create a username from the email (remove @ and domain) or display name
        let username = '';
        if (email) {
          username = email.split('@')[0];
        } else if (displayName) {
          // Convert display name to username format (lowercase, no spaces)
          username = displayName.toLowerCase().replace(/\s+/g, '_');
        } else {
          username = `user_${Date.now()}`;
        }
        
        // Add uniqueness to username if needed
        const usernameSuffix = Math.floor(Math.random() * 1000).toString();
        
        // Create the user in our database
        user = await storage.createUser({
          username: `${username}_${usernameSuffix}`,
          email: email,
          name: displayName || username,
          password: hashedPassword,
          firebaseUid: uid,
          isAdmin: false
        });
        
        console.log(`New user created: ${user.username} (ID: ${user.id})`);
      } else {
        console.log(`Existing user found: ${user.username} (ID: ${user.id})`);
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return next(err);
        }
        console.log(`User logged in successfully: ${user.username} (ID: ${user.id})`);
        res.status(200).json(user);
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ message: "Authentication failed", error: (error as Error).message });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
