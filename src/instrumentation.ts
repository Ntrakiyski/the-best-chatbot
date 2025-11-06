import { IS_VERCEL_ENV } from "lib/const";
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!IS_VERCEL_ENV) {
      // Run DB migration with Sentry instrumentation
      await Sentry.startSpan(
        {
          name: "db.migration",
          op: "db.migration",
          attributes: {
            environment: process.env.NODE_ENV || "unknown",
          },
        },
        async () => {
          const runMigrate = await import("./lib/db/pg/migrate.pg").then(
            (m) => m.runMigrate,
          );
          await runMigrate().catch((e) => {
            Sentry.captureException(e, {
              tags: {
                component: "db-migration",
              },
            });
            console.error(e);
            process.exit(1);
          });
        },
      );
      
      // Initialize MCP Manager with Sentry instrumentation
      await Sentry.startSpan(
        {
          name: "mcp.manager.init",
          op: "mcp.init",
          attributes: {
            environment: process.env.NODE_ENV || "unknown",
          },
        },
        async () => {
          const { initMCPManager, mcpClientsManager } = await import(
            "./lib/ai/mcp/mcp-manager"
          );
          
          try {
            await initMCPManager();
            
            // Capture MCP initialization event (custom event #9)
            const clients = await mcpClientsManager.getClients();
            const tools = await mcpClientsManager.tools();
            
            Sentry.captureMessage("mcp.manager.init", {
              level: "info",
              tags: {
                component: "mcp-manager",
              },
              extra: {
                serverCount: clients.length,
                toolCount: Object.keys(tools).length,
                serverNames: clients.map((c) => c.id),
              },
            });
            
            Sentry.setTag("mcp.servers", clients.length.toString());
            Sentry.setTag("mcp.tools", Object.keys(tools).length.toString());
          } catch (error) {
            Sentry.captureException(error, {
              tags: {
                component: "mcp-manager",
              },
            });
            throw error;
          }
        },
      );
    }
  }
}
