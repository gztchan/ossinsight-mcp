import { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";
import { registerTools } from "./tools.js";

const server = new McpServer({
  name: "ossinsight-mcp",
  version: "0.1.0"
});

registerTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Failed to start ossinsight-mcp: ${message}\n`);
  process.exit(1);
});
