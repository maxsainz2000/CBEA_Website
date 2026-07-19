# Gemini Configuration & Skills Summary

This workspace contains customized configuration and skills configured during the pair-programming session.

## 1. Supabase MCP Server Configuration
The Supabase MCP server has been configured globally in the user configuration path:
- File: [mcp_config.json](file:///c:/Users/Admin/.gemini/config/mcp_config.json)

### Configuration Details
```json
{
  "mcpServers": {
    "supabase": {
      "serverUrl": "https://mcp.supabase.com/mcp?project_ref=<YOUR_PROJECT_REF>&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching%2Cstorage"
    }
  }
}
```

## 2. Installed Agent Skills
The following agent skills have been installed locally in this workspace under the workspace customizations directory:
- Path: [.agents/skills/](file:///c:/Users/Admin/Documents/CBEA_Website/.agents/skills)

### Skills Installed
1. **[supabase](file:///c:/Users/Admin/Documents/CBEA_Website/.agents/skills/supabase)**
   - **Description**: Use when doing ANY task involving Supabase. Covers Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues, client libraries, SSR integrations, schema changes, migrations, and extensions.
2. **[supabase-postgres-best-practices](file:///c:/Users/Admin/Documents/CBEA_Website/.agents/skills/supabase-postgres-best-practices)**
   - **Description**: Postgres performance optimization and best practices from Supabase. Use this skill when writing, reviewing, or optimizing Postgres queries, schema designs, or database configurations.
3. **vercel-plugin**
   - **Description**: Build and deploy web apps. Integrated via `npx plugins add vercel/vercel-plugin`. Provides 30 skills, 5 cmds, hooks, and MCP integration.
