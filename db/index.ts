import { drizzle } from "drizzle-orm/neon-serverless";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import ws from "ws";
import * as schema from "@db/schema";

class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

function validateDatabaseUrl(url: string): void {
  try {
    const dbUrl = new URL(url);
    if (!dbUrl.protocol || !dbUrl.host || !dbUrl.pathname) {
      throw new Error("Invalid database URL components");
    }
    if (!dbUrl.protocol.startsWith('postgres')) {
      throw new Error("Database URL must use PostgreSQL protocol");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new DatabaseError(
        `Invalid DATABASE_URL configuration: ${error.message}. Expected format: postgresql://user:password@host:port/database`
      );
    }
    throw error;
  }
}

// Database connection configuration
const DB_CONNECTION_RETRIES = 3;
const DB_CONNECTION_RETRY_DELAY = 1000; // 1 second

async function createDatabaseConnection(): Promise<NeonHttpDatabase<typeof schema>> {
  if (!process.env.DATABASE_URL) {
    throw new DatabaseError(
      "DATABASE_URL environment variable is not set. Please provision a database and set the DATABASE_URL."
    );
  }

  validateDatabaseUrl(process.env.DATABASE_URL);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= DB_CONNECTION_RETRIES; attempt++) {
    try {
      console.log(`Attempting database connection (attempt ${attempt}/${DB_CONNECTION_RETRIES})...`);

      const db = drizzle({
        connection: process.env.DATABASE_URL,
        schema,
        ws: ws,
      });

      // Test the connection
      await db.execute(sql`SELECT 1`);
      console.log('Database connection established successfully');
      return db;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Database connection attempt ${attempt} failed:`, {
        error: lastError.message,
        stack: lastError.stack
      });

      if (attempt < DB_CONNECTION_RETRIES) {
        console.log(`Retrying in ${DB_CONNECTION_RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, DB_CONNECTION_RETRY_DELAY));
      }
    }
  }

  throw new DatabaseError(
    `Failed to establish database connection after ${DB_CONNECTION_RETRIES} attempts. Last error: ${lastError?.message}`
  );
}

// Initialize database connection
let db: NeonHttpDatabase<typeof schema>;

try {
  db = await createDatabaseConnection();
} catch (error) {
  console.error('Fatal database initialization error:', error);
  throw error;
}

export { db, DatabaseError };