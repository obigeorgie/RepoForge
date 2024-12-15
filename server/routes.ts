import type { Express, Request } from "express";
import { createServer } from "http";
import OpenAI from "openai";
import { db } from "@db";
import { users, repositories, bookmarks } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";

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
      secret: 'your-secret-key'
    })
  );

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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that analyzes GitHub repositories and suggests potential use cases. Provide 3 concise suggestions in JSON format with a 'suggestions' array.",
        },
        {
          role: "user",
          content: `Repository name: ${name}\nDescription: ${description}\n\nProvide 3 potential use cases for this repository. Return them in JSON format with a 'suggestions' array.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || '{"suggestions": []}');
    return {
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error analyzing repository:", error);
    return {
      suggestions: [],
      analyzedAt: new Date().toISOString(),
    };
  }
}
