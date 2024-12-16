import type { Express } from "express";
import { createServer } from "http";
import OpenAI from "openai";
import { db } from "@db";
import { users, repositories, bookmarks } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";

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

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

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

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: `${process.env.APP_URL || 'http://localhost:5000'}/api/auth/github/callback`,
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

  app.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/me", (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json(req.user);
    } catch (error) {
      console.error('Error in /api/me:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/trending", async (req, res) => {
    try {
      const { language } = req.query;
      
      // Validate language parameter if provided
      if (language && typeof language !== 'string') {
        return res.status(400).json({ message: "Invalid language parameter" });
      }
      
      // Check GitHub token
      if (!process.env.GITHUB_TOKEN) {
        console.error('Missing GitHub token');
        return res.status(503).json({ message: "GitHub API service unavailable" });
      }

      const url = new URL("https://api.github.com/search/repositories");
      
      let q = "stars:>100";
      if (language && language !== "All") {
        q += ` language:${encodeURIComponent(language)}`;
      }
      
      url.searchParams.append("q", q);
      url.searchParams.append("sort", "stars");
      url.searchParams.append("order", "desc");
      url.searchParams.append("per_page", "30");

      const headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": `token ${process.env.GITHUB_TOKEN}`,
      };

      const response = await fetch(url.toString(), { headers });

      if (!response.ok) {
        const error = await response.text();
        console.error('GitHub API Error:', {
          status: response.status,
          statusText: response.statusText,
          error
        });
        
        if (response.status === 403) {
          throw new Error("GitHub API rate limit exceeded. Please try again later.");
        } else if (response.status === 401) {
          throw new Error("Unauthorized access to GitHub API. Please check your token.");
        } else {
          throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      if (!data.items || !Array.isArray(data.items)) {
        console.error('Invalid GitHub API response:', data);
        throw new Error("Invalid response format from GitHub API");
      }
      
      console.log('Processing repositories with AI analysis...');
      
      const repos = await Promise.all(data.items.map(async (item: any) => {
        console.log(`Processing repository: ${item.full_name}`);
        
        let repo = await db.query.repositories.findFirst({
          where: eq(repositories.githubId, item.id.toString()),
        });

        if (!repo) {
          console.log(`Getting AI analysis for: ${item.full_name}`);
          const aiAnalysis = await analyzeRepository(item.description, item.full_name);
          console.log('AI Analysis result for', item.full_name, ':', {
            suggestions: aiAnalysis.suggestions,
            insights: aiAnalysis.insights,
            trendingScore: aiAnalysis.trendingScore
          });
          
          const [newRepo] = await db
            .insert(repositories)
            .values({
              githubId: item.id.toString(),
              name: item.full_name,
              description: item.description || '',
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
                insights: aiAnalysis.insights
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
          aiAnalysis: repo.aiAnalysis,
        };
      }));

      res.json(repos);
    } catch (error) {
      console.error("Error fetching trending repos:", error);
      res.status(500).json({ message: "Failed to fetch trending repositories" });
    }
  });

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
        aiAnalysis: b.repository.aiAnalysis,
      })));
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.post("/api/bookmarks", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { repoId } = req.body;
      if (!repoId || typeof repoId !== 'number') {
        return res.status(400).json({ message: "Invalid repository ID" });
      }

      const repository = await db.query.repositories.findFirst({
        where: eq(repositories.id, repoId),
      });

      if (!repository) {
        return res.status(404).json({ message: "Repository not found" });
      }

      const existingBookmark = await db.query.bookmarks.findFirst({
        where: and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.repositoryId, repoId)
        ),
      });

      if (existingBookmark) {
        return res.status(409).json({ message: "Bookmark already exists" });
      }

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
      if (error instanceof Error) {
        console.error({
          type: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  return httpServer;
}

async function analyzeRepository(description: string | null, name: string): Promise<{
  suggestions: string[];
  analyzedAt: string;
  topKeywords: string[];
  domainCategory: string;
  trendingScore: number;
  insights: {
    trendReason: string;
    ecosystemImpact: string;
    futureOutlook: string;
  };
}> {
  try {
    const systemPrompt = `You are an AI assistant analyzing GitHub repositories. Given this repository: "${name}" with description: "${description || 'No description'}", analyze its impact and provide insights.

Remember to:
1. Provide 3 practical learning suggestions
2. Analyze why this repository is trending
3. Assess its impact on the developer ecosystem
4. Predict its future trajectory

Respond in this exact JSON format:
{
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "insights": {
    "trendReason": "Brief explanation of why this repo is trending",
    "ecosystemImpact": "How this affects the developer ecosystem",
    "futureOutlook": "Predicted future trajectory and relevance"
  }
}`;

    console.log('Calling OpenAI API for repository:', name);
    let retries = 3;
    let response = null;
    
    while (retries > 0) {
      try {
        response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "system", content: systemPrompt }],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 500
        });
        break;
      } catch (error: any) {
        console.error('OpenAI API error:', error);
        retries--;
        
        if (error?.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers?.['retry-after'] || '60', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        
        if (retries === 0) {
          throw new Error(`OpenAI API error: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error("Invalid or empty response from OpenAI API");
    }

    const content = response.choices[0].message.content;
    let result;
    
    try {
      result = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI API');
    }

    const suggestions = Array.isArray(result.suggestions) 
      ? result.suggestions.filter((s: unknown): s is string => typeof s === 'string' && s.length > 0)
      : [];

    while (suggestions.length < 3) {
      suggestions.push(
        suggestions.length === 0
          ? `Study the codebase of ${name} to understand its architecture`
          : suggestions.length === 1
          ? `Implement features in ${name} to practice contributing`
          : `Write tests for ${name} to learn testing practices`
      );
    }

    const insights = {
      trendReason: typeof result.insights?.trendReason === 'string' 
        ? result.insights.trendReason 
        : `${name} is gaining traction in the developer community`,
      ecosystemImpact: typeof result.insights?.ecosystemImpact === 'string'
        ? result.insights.ecosystemImpact
        : "Contributing to developer productivity",
      futureOutlook: typeof result.insights?.futureOutlook === 'string'
        ? result.insights.futureOutlook
        : "Expected to maintain steady growth and adoption"
    };

    const analysisResult = {
      suggestions: suggestions.slice(0, 3),
      analyzedAt: new Date().toISOString(),
      topKeywords: ["github", "learning", "programming"],
      domainCategory: "Educational Resources",
      trendingScore: 75,
      insights
    };

    return analysisResult;
  } catch (error) {
    console.error("Error analyzing repository:", error);
    
    if (error instanceof Error) {
      console.error({
        type: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    return {
      suggestions: [
        `Study the codebase of ${name} to understand its architecture`,
        `Implement a small feature in ${name} to practice contributing`,
        `Write tests for ${name} to learn testing practices`
      ],
      analyzedAt: new Date().toISOString(),
      topKeywords: ["github", "learning", "programming"],
      domainCategory: "Educational Resources",
      trendingScore: 50,
      insights: {
        trendReason: `${name} shows potential for growth`,
        ecosystemImpact: "Contributing to developer productivity",
        futureOutlook: "Monitoring community adoption and development"
      }
    };
  }
}
