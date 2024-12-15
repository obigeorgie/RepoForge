import type { Express, Request } from "express";
import { createServer } from "http";
import OpenAI from "openai";
import { db } from "@db";
import { users, repositories, bookmarks } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const MemoryStoreSession = MemoryStore(session);

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Setup session middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 },
      store: new MemoryStoreSession({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || 'your-secret-key'
    })
  );

  // Initialize Passport and restore authentication state from session
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user for the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Setup GitHub authentication strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: "http://localhost:5000/api/auth/github/callback",
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          let user = await db.query.users.findFirst({
            where: eq(users.githubId, profile.id.toString()),
          });

          if (!user) {
            const [newUser] = await db
              .insert(users)
              .values({
                username: profile.username,
                githubId: profile.id.toString(),
                avatar: profile.photos?.[0]?.value,
                bio: profile._json.bio,
              })
              .returning();
            user = newUser;
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // GitHub authentication routes
  app.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  // Get user profile
  app.get("/api/me", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });

  // Get trending repositories
  app.get("/api/trending", async (req, res) => {
    try {
      const { language } = req.query;
      const url = new URL("https://api.github.com/search/repositories");
      
      // Build search query
      let q = "stars:>100";
      if (language && language !== "All") {
        q += ` language:${language}`;
      }
      
      url.searchParams.append("q", q);
      url.searchParams.append("sort", "stars");
      url.searchParams.append("order", "desc");
      url.searchParams.append("per_page", "30");

      const response = await fetch(url.toString(), {
        headers: {
          "Accept": "application/vnd.github+json",
          "Authorization": `token ${process.env.GITHUB_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch from GitHub API");
      }

      const data = await response.json();
      
      // Process each repository
      const repos = await Promise.all(data.items.map(async (item: any) => {
        // Get or create repository in database
        let repo = await db.query.repositories.findFirst({
          where: eq(repositories.githubId, item.id.toString()),
        });

        if (!repo) {
          const aiAnalysis = await analyzeRepository(item.description || "", item.name);
          
          const [newRepo] = await db
            .insert(repositories)
            .values({
              githubId: item.id.toString(),
              name: item.full_name,
              description: item.description,
              language: item.language,
              stars: item.stargazers_count,
              forks: item.forks_count,
              url: item.html_url,
              aiAnalysis,
            })
            .returning();
          
          repo = newRepo;
        }

        return {
          id: repo.id,
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stars,
          forks: repo.forks,
          url: repo.url,
          aiSuggestions: repo.aiAnalysis?.suggestions,
        };
      }));

      res.json(repos);
    } catch (error) {
      console.error("Error fetching trending repos:", error);
      res.status(500).json({ message: "Failed to fetch trending repositories" });
    }
  });

  // Get user's bookmarks
  app.get("/api/bookmarks", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userBookmarks = await db.query.bookmarks.findMany({
        where: eq(bookmarks.userId, userId),
        with: {
          repository: true,
        },
      });

      res.json(userBookmarks.map(b => ({
        id: b.repository.id,
        name: b.repository.name,
        description: b.repository.description,
        language: b.repository.language,
        stars: b.repository.stars,
        forks: b.repository.forks,
        url: b.repository.url,
        aiSuggestions: b.repository.aiAnalysis?.suggestions,
      })));
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Create bookmark
  app.post("/api/bookmarks", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { repoId } = req.body;
      
      const [bookmark] = await db
        .insert(bookmarks)
        .values({
          userId,
          repositoryId: repoId,
        })
        .returning();

      res.json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  return httpServer;
}

async function analyzeRepository(description: string, name: string) {
  try {
    const systemPrompt = `You are an AI assistant specialized in analyzing GitHub repositories and identifying their potential applications and use cases. Your goal is to suggest innovative and practical ways the repository could be used in real-world scenarios.

Rules:
1. Each suggestion should be specific, actionable, and highlight unique value propositions
2. Consider both technical and business perspectives
3. Keep suggestions concise (max 100 characters)
4. Focus on practical applications that could be implemented immediately
5. Avoid generic suggestions like "learn programming" or "study code"

Format your response as a JSON object with a 'suggestions' array containing exactly 3 strings.`;

    const userPrompt = `Repository Name: ${name}
Description: ${description}

Based on this information, provide 3 specific use cases or applications for this repository.
Format: {"suggestions": ["suggestion1", "suggestion2", "suggestion3"]}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const result = JSON.parse(content);
    if (!Array.isArray(result.suggestions) || result.suggestions.length !== 3) {
      throw new Error("Invalid suggestions format from OpenAI");
    }

    return {
      suggestions: result.suggestions.map(s => s.slice(0, 100)), // Limit length
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error analyzing repository:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    
    // Return empty suggestions but don't fail the whole request
    return {
      suggestions: [],
      analyzedAt: new Date().toISOString(),
    };
  }
}
