import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function mongoApiPlugin(): Plugin {
  return {
    name: 'mongo-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = urlObj.pathname;

        let rawBody = '';
        req.on('data', chunk => { rawBody += chunk; });
        req.on('end', async () => {
          try {
            (req as any).body = rawBody ? JSON.parse(rawBody) : {};
          } catch {
            (req as any).body = rawBody;
          }

          (res as any).status = (code: number) => {
            res.statusCode = code;
            return res;
          };
          (res as any).json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };

          try {
            if (pathname === '/api/leaderboard') {
              const { default: handler } = await import('./api/leaderboard.js');
              return handler(req as any, res as any);
            } else if (pathname === '/api/session') {
              const { default: handler } = await import('./api/session.js');
              return handler(req as any, res as any);
            } else if (pathname === '/api/results') {
              const { default: handler } = await import('./api/results.js');
              return handler(req as any, res as any);
            }
            next();
          } catch (err: any) {
            console.error(`[API Error] ${pathname}:`, err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), mongoApiPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
