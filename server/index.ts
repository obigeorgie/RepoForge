import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { DatabaseError } from "@db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Error handling middleware after routes
function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  // Handle specific error types
  if (err instanceof DatabaseError) {
    return res.status(503).json({
      error: 'Database Error',
      message: err.message,
      code: 'DATABASE_ERROR',
    });
  }

  // Handle validation errors (e.g., from Zod)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: err.message,
      code: 'VALIDATION_ERROR',
    });
  }

  // Default error response
  const status = 'status' in err ? Number(err.status) || 500 : 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: err.name || 'Error',
    message: message,
    ...(app.get('env') === 'development' ? { stack: err.stack } : {}),
    code: 'INTERNAL_ERROR',
  });
}

(async () => {
  try {
    const server = registerRoutes(app);

    // Add error handling middleware
    app.use(errorHandler);

    // Setup vite or serve static files
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();