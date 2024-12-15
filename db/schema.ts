import { pgTable, text, serial, integer, timestamp, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  githubId: text("github_id").unique().notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(),
  platformId: text("platform_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language"),
  stars: integer("stars").default(0),
  forks: integer("forks").default(0),
  url: text("url").notNull(),
  platformData: jsonb("platform_data").$type<{
    github?: {
      owner: string;
      repo: string;
      topics?: string[];
      license?: string;
    };
    gitlab?: {
      namespace: string;
      projectId: number;
      visibility?: string;
    };
    bitbucket?: {
      workspace: string;
      repo_slug: string;
      scm?: string;
    };
  }>(),
  aiAnalysis: jsonb("ai_analysis").$type<{
    suggestions: string[];
    analyzedAt: string;
    topKeywords?: string[];
    domainCategory?: string;
    trendingScore?: number;
    insights?: {
      trendReason: string;
      ecosystemImpact: string;
      futureOutlook: string;
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  platformUnique: uniqueIndex('platform_unique_idx').on(table.platform, table.platformId)
}));

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  repositoryId: integer("repository_id").references(() => repositories.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookmarks: many(bookmarks),
}));

export const repositoriesRelations = relations(repositories, ({ many }) => ({
  bookmarks: many(bookmarks),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  repository: one(repositories, {
    fields: [bookmarks.repositoryId],
    references: [repositories.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertRepositorySchema = createInsertSchema(repositories);
export const selectRepositorySchema = createSelectSchema(repositories);

export const insertBookmarkSchema = createInsertSchema(bookmarks);
export const selectBookmarkSchema = createSelectSchema(bookmarks);

// Types
export type User = typeof users.$inferSelect;
export type Repository = typeof repositories.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;