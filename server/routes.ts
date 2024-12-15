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
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}
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
      console.log('GitHub API Response:', data.items[0]); // Log first item
      
      // Process each repository
      const repos = await Promise.all(data.items.map(async (item: any) => {
        console.log(`Processing repository: ${item.full_name}`);
        // Get or create repository in database
        let repo = await db.query.repositories.findFirst({
          where: eq(repositories.githubId, item.id.toString()),
        });

        if (!repo) {
          console.log(`Getting AI analysis for: ${item.full_name}`);
          const aiAnalysis = await analyzeRepository(item.description, item.full_name);
          console.log('AI Analysis result:', aiAnalysis);
          
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
              aiAnalysis: {
                suggestions: aiAnalysis.suggestions,
                analyzedAt: aiAnalysis.analyzedAt,
                topKeywords: aiAnalysis.topKeywords,
                domainCategory: aiAnalysis.domainCategory,
                trendingScore: aiAnalysis.trendingScore,
              },
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
          aiAnalysis: repo.aiAnalysis ? {
            suggestions: repo.aiAnalysis.suggestions,
            analyzedAt: repo.aiAnalysis.analyzedAt,
            topKeywords: repo.aiAnalysis.topKeywords || [],
            domainCategory: repo.aiAnalysis.domainCategory || "Unknown",
            trendingScore: repo.aiAnalysis.trendingScore || 50,
          } : undefined,
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

async function analyzeRepository(description: string | null, name: string): Promise<{ suggestions: string[], analyzedAt: string, topKeywords: string[], domainCategory: string, trendingScore: number }> {
  try {
    const systemPrompt = `You are an AI assistant analyzing GitHub repositories. Given this repository: "${name}" with description: "${description || 'No description'}", provide exactly 3 practical suggestions for developers.

Remember:
1. Each suggestion must be a complete, actionable sentence under 100 characters
2. Focus on concrete learning opportunities
3. Respond in this exact JSON format:
{
  "suggestions": [
    "Build X by following the tutorial",
    "Create Y using the examples",
    "Learn Z by implementing features"
  ]
}`;

    console.log('Calling OpenAI API for repository:', name);
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    console.log('OpenAI API response:', content);

    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const result = JSON.parse(content);
    const suggestions = Array.isArray(result.suggestions) ? result.suggestions : [];

    // Ensure we have exactly 3 valid string suggestions
    const validSuggestions = suggestions
      .filter((s): s is string => typeof s === 'string' && s.length > 0)
      .slice(0, 3);

    // If we don't have enough valid suggestions, add defaults
    while (validSuggestions.length < 3) {
      validSuggestions.push(
        validSuggestions.length === 0 
          ? `Explore ${name} through hands-on coding exercises`
          : validSuggestions.length === 1
          ? `Build a project using ${name}'s features`
          : `Share your learnings from ${name} with the community`
      );
    }

    return {
      suggestions: validSuggestions,
      analyzedAt: new Date().toISOString(),
      topKeywords: ["github", "learning", "programming"],
      domainCategory: "Educational Resources",
      trendingScore: 75,
    };
  } catch (error) {
    console.error("Error analyzing repository:", error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error("Error type:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Create context-aware default suggestions
    const defaultSuggestions = [
      `Study the codebase of ${name} to understand its architecture`,
      `Implement a small feature in ${name} to practice contributing`,
      `Write tests for ${name} to learn testing practices`
    ];
    
    return {
      suggestions: defaultSuggestions,
      analyzedAt: new Date().toISOString(),
      topKeywords: ["github", "learning", "programming"],
      domainCategory: "Educational Resources",
      trendingScore: 50,
    };
  }
}