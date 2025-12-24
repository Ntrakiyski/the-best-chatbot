import { IS_VERCEL_ENV } from "lib/const";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Run DB migration
    // This now runs in ALL environments (local, Docker, and Vercel)
    const runMigrate = await import("./lib/db/pg/migrate.pg").then(
      (m) => m.runMigrate,
    );
    await runMigrate().catch((e) => {
      console.error("DB Migration failed:", e);
      process.exit(1);
    });

    // Initialize MCP Manager
    // Only run MCP initialization in non-Vercel environments
    if (!IS_VERCEL_ENV) {
      const { initMCPManager, mcpClientsManager } = await import(
        "./lib/ai/mcp/mcp-manager"
      );

      try {
        await initMCPManager();

        // Log MCP initialization
        const clients = await mcpClientsManager.getClients();
        const tools = await mcpClientsManager.tools();

        console.info("MCP Manager initialized:", {
          serverCount: clients.length,
          toolCount: Object.keys(tools).length,
          serverNames: clients.map((c) => c.id),
        });
      } catch (error) {
        console.error("MCP Manager initialization failed:", error);
        throw error;
      }
    }
  }
}
