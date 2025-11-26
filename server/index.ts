import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startAutoExtendJob } from "./autoExtend";
import { startAutoActivateJob } from "./autoActivate";
import { startAutoExpireJob } from "./autoExpire";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(cookieParser());
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Access Control Middleware - Block external users
app.use((req, res, next) => {
  const accessPassword = process.env.SITE_ACCESS_PASSWORD;
  
  // Skip access control if no password is set
  if (!accessPassword) {
    return next();
  }
  
  // Allow access to the login endpoint
  if (req.path === '/api/site-access/verify') {
    return next();
  }
  
  // Check if user has valid access token in cookie
  const accessToken = req.cookies?.siteAccessToken;
  if (accessToken === accessPassword) {
    return next();
  }
  
  // Block all other requests
  if (req.path.startsWith('/api')) {
    return res.status(403).json({ 
      error: 'SITE_ACCESS_REQUIRED',
      message: 'Site access password required' 
    });
  }
  
  // For non-API requests, serve a simple access page
  return res.status(403).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Site Access Required</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .access-box {
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 400px;
          width: 90%;
        }
        h1 {
          margin: 0 0 1rem 0;
          color: #1a202c;
          font-size: 1.5rem;
        }
        p {
          color: #4a5568;
          margin-bottom: 1.5rem;
        }
        input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 1rem;
          margin-bottom: 1rem;
          box-sizing: border-box;
        }
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        button {
          width: 100%;
          padding: 0.75rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        button:hover {
          background: #5a67d8;
        }
        button:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }
        .error {
          color: #e53e3e;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          display: none;
        }
        .error.show {
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="access-box">
        <h1>🔒 Access Required</h1>
        <p>This site is currently restricted. Please enter the access password to continue.</p>
        <form id="accessForm">
          <input 
            type="password" 
            id="password" 
            placeholder="Enter access password"
            autocomplete="off"
            required
          />
          <button type="submit" id="submitBtn">Access Site</button>
          <div class="error" id="error">Incorrect password. Please try again.</div>
        </form>
      </div>
      <script>
        const form = document.getElementById('accessForm');
        const error = document.getElementById('error');
        const submitBtn = document.getElementById('submitBtn');
        
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          error.classList.remove('show');
          submitBtn.disabled = true;
          submitBtn.textContent = 'Verifying...';
          
          const password = document.getElementById('password').value;
          
          try {
            const response = await fetch('/api/site-access/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password })
            });
            
            const data = await response.json();
            
            if (data.success) {
              document.cookie = 'siteAccessToken=' + password + '; path=/; max-age=' + (30 * 24 * 60 * 60);
              window.location.reload();
            } else {
              error.classList.add('show');
              submitBtn.disabled = false;
              submitBtn.textContent = 'Access Site';
            }
          } catch (err) {
            error.classList.add('show');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Access Site';
          }
        });
      </script>
    </body>
    </html>
  `);
});

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    // Start background jobs for offer lifecycle automation
    startAutoExtendJob();
    startAutoActivateJob();
    startAutoExpireJob();
  });
})();
