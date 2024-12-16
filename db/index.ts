import { drizzle } from "drizzle-orm/neon-serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import ws from "ws";
import * as schema from "@db/schema";

function validateDatabaseUrl(url: string): void {
  try {
    const dbUrl = new URL(url);
    if (!dbUrl.protocol || !dbUrl.host || !dbUrl.pathname) {
      throw new Error("Invalid database URL format");
    }
  } catch (error) {
    throw new Error(
      "Invalid DATABASE_URL format. Expected format: postgresql://user:password@host:port/database"
    );
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Please provision a database and set the DATABASE_URL."
  );
}

validateDatabaseUrl(process.env.DATABASE_URL);

let db: NeonHttpDatabase<typeof schema>;

try {
  db = drizzle({
    connection: process.env.DATABASE_URL,
    schema,
    ws: ws,
  });
} catch (error) {
  console.error("Failed to initialize database connection:", error);
  throw new Error("Database connection failed. Please check your DATABASE_URL and ensure the database is accessible.");
}

export { db };
